// URL to explain PHASER scene: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scene/

export default class Game extends Phaser.Scene {
  constructor() {
    // key of the scene
    // the key will be used to start the scene by other scenes
    super("game");
  }

  init() {
    // this is called before the scene is created
    // init variables
    // take data passed from other scenes
    // data object param {}
  }

  preload() {
    // load assets
    this.load.image("sky", "./public/assets/sky.png");
    this.load.image("ground", "./public/assets/platform.png");
    this.load.image("star", "./public/assets/star.png");
    this.load.image("bomb", "./public/assets/bomb.png");
    this.load.spritesheet("dude", "./public/assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  create() {
    // create game objects
    this.add.image(400, 300, "sky");

    this.platforms = this.physics.add.staticGroup();

    this.platforms.create(400, 568, "ground").setScale(2).refreshBody();

    this.platforms.create(600, 400, "ground");
    this.platforms.create(50, 250, "ground");
    this.platforms.create(750, 220, "ground");

    this.player = this.physics.add.sprite(100, 450, "dude");

    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 4 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });

    this.cursors = this.input.keyboard.createCursorKeys();

    // al morir, presiono la tecla "R" para reiniciar el juego
    this.input.keyboard.on('keydown-R', () => {
      if (this.gameOver) {
        this.scene.restart();
      }
    });

    this.stars = this.physics.add.group({
      key: "star",
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 },
    });

    this.stars.children.iterate(function (child) {
      child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    this.bombs = this.physics.add.group();

    this.score = 0;
    this.gameOver = false;

    this.scoreText = this.add.text(16, 16, `Score: ${this.score}`, {
      fontSize: "32px",
      fill: "#000",
    });

    this.gameOverText = this.add.text(400, 300, 'GAME OVER', {
      fontSize: '64px',
      fill: '#ff0000'
    });

    this.gameOverText.setOrigin(0.5); //centra el texto
    this.gameOverText.setVisible(false); //para que no se vea y este oculto al principio

    this.restartText = this.add.text(400, 350, 'press "R" to restart', {
      fontSize: '45px',
      fill: '#ff0000'
    });

    this.restartText.setOrigin(0.5); //centra el texto
    this.restartText.setVisible(false); //para que no se vea y este oculto al principio

    // agrego temporizador de 30 segundos
    this.timeLeft = 30; // Empezamos con 30 segundos

    this.timerText = this.add.text(780, 16, `Tiempo: ${this.timeLeft}`, {
      fontSize: '32px', //tamaño de la fuente
      fill: '#000' //color de la fuente
    });

    this.timerText.setOrigin(1, 0); // para que esté arriba a la derecha

    this.physics.add.collider(this.player, this.platforms);

    this.physics.add.collider(this.stars, this.platforms);

    this.physics.add.overlap(
      this.player,
      this.stars,
      this.collectStar,
      null,
      this
    );

    this.physics.add.collider(
      this.player,
      this.bombs,
      this.hitBomb,
      null,
      this
    );
  }

  update() {
    // update game objects
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);

      this.player.anims.play("left", true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);

      this.player.anims.play("right", true);
    } else {
      this.player.setVelocityX(0);

      this.player.anims.play("turn");
    }

    if (this.cursors.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-330);
    }

    if (this.gameOver) {
      return;
    }

    if (this.restart) {
      return;
    }
  
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);
      this.player.anims.play('left', true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);
      this.player.anims.play('right', true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play('turn');
    }
  
    if (this.cursors.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-330);
    }
  
    // Descontar el tiempo
    this.timeLeft -= this.game.loop.delta / 1000;
  
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.endGame(); // Cuando el tiempo llega a 0
    }
  
    this.timerText.setText(`Tiempo: ${Math.ceil(this.timeLeft)}`);
  }

  endGame() {
    this.gameOver = true;
    this.physics.pause(); // Detiene todo
    this.player.setTint(0xff0000); // Pone al personaje en rojo
    this.player.anims.play('turn'); // Animación quieta
    this.gameOverText.setVisible(true); // Mostrar "GAME OVER"
    this.restartText.setVisible(true); // mostrar "press "R" to restar"
  }

  collectStar(player, star) {
    star.disableBody(true, true);

    this.score += 10;
    this.scoreText.setText(`Score: ${this.score}`);

    if (this.stars.countActive(true) === 0) {
      //  A new batch of stars to collect
      this.stars.children.iterate(function (child) {
        child.enableBody(true, child.x, 0, true, true);
      });

      var x =
        this.player.x < 400
          ? Phaser.Math.Between(400, 800)
          : Phaser.Math.Between(0, 400);

      var bomb = this.bombs.create(x, 16, "bomb");
      bomb.setBounce(1);
      bomb.setCollideWorldBounds(true);
      bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
      bomb.allowGravity = false;
    }
  }

  hitBomb(player, bomb) {
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play('turn');
    this.endGame();
  }
}
