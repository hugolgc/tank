import kaboom from "kaboom";

const MAP = {
  little: [
    "ooooooooooooooo",
    "o             o",
    "o o o   o  oo o",
    "o ooo     oo  o",
    "o  o          o",
    "o  o ooo   oo o",
    "o        o o  o",
    "o        o o  o",
    "o oo oo oo o  o",
    "o  o       oo o",
    "o     o       o",
    "ooooooooooooooo",
  ],
  medium: [
    "oooooooooooooo",
    "o   o     oooo",
    "o      o    oo",
    "o oooo   oo oo",
    "o o      oo oo",
    "o o oo oooo oo",
    "o    o oo    o",
    "o    o oo    o",
    "ooo        o o",
    "ooo oo    oo o",
    "ooo    o     o",
    "oooooooooooooo",
  ],
  large: [
    "oooooooooooooooooooooo",
    "oooiooooo    ooo   ooo",
    "oooiiiioo oo oo  o  oo",
    "oooiiii              o",
    "ooiiiiioo oo         o",
    "ooiiiiooo ooo oooiiioo",
    "ooo ooooo  oo oooioioo",
    "ooo ooo       oooiiioo",
    "oo    o o  oooo     oo",
    "oo      o oooo      oo",
    "o  o   oo oooo  o  ooo",
    "o      o   oo   o oooo",
    "ooo  ooo        oooooo",
    "oo    ooo o     oooooo",
    "oo    ooo o oo  oooooo",
    "ooo   iii    ooooooooo",
    "oooo  iii   oooooooooo",
    "oooooooooooooooooooooo",
  ],
};

const PLAYER_SPEED = 100;
const BULLET_SPEED = 200;
const COLORS = {
  red: [239, 68, 68],
  green: [34, 197, 94],
  600: [82, 82, 82],
  700: [64, 64, 64],
  800: [38, 38, 38],
  900: [23, 23, 23],
  1000: [12, 12, 12],
};

kaboom({
  background: COLORS[900],
  scale: 1.25,
});

const map = addLevel(MAP.large, {
  width: 100,
  height: 100,
  " ": () => [
    rect(100, 100, 100),
    color(COLORS[700]),
    origin("center"),
    area(),
    "floor",
  ],
  i: () => [
    rect(100, 100),
    color(COLORS[600]),
    origin("center"),
    area(),
    "zone",
  ],
  o: () => [
    rect(100, 100),
    color(COLORS[900]),
    origin("center"),
    area(),
    solid(),
    "wall",
  ],
});

const player = add([
  pos(map.getPos(7, 3)),
  rect(50, 50),
  color(COLORS.green),
  origin("center"),
  area(),
  solid(),
  { status: "alive", score: 0, kills: 0, deaths: 0, series: 0 },
  "player",
]);

const score = add([text(getScore(player), 0), pos(0, 0), scale(0.5), fixed()]);

function getScore(player) {
  return `
		Score  ${player.score}
		Kills  ${player.kills}
		Series ${player.series}
		Deaths ${player.deaths}
	`;
}

function addKill() {
  player.kills++;
  player.series++;
  player.score += 100;
  score.text = getScore(player);
}

function addDeath() {
  player.hidden = true;
  player.paused = true;
  player.status = "dead";
  player.series = 0;
  player.deaths++;
  player.score -= 50;

  if (player.score < 1) player.score = 0;
  score.text = getScore(player);
  shake(25);

  setTimeout(() => {
    player.moveTo(map.getPos(7, 3));
    player.hidden = false;
    player.paused = false;
    player.status = "alive";
  }, 3000);
}

player.onUpdate(() => camPos(player.pos));
onKeyDown(["z", "up"], () => player.move(0, -PLAYER_SPEED));
onKeyDown(["s", "down"], () => player.move(0, PLAYER_SPEED));
onKeyDown(["q", "left"], () => player.move(-PLAYER_SPEED, 0));
onKeyDown(["d", "right"], () => player.move(PLAYER_SPEED, 0));

function shoot() {
  if (player.status === "dead") return;

  const bullet = add([
    pos(player.pos),
    circle(6.25),
    color(COLORS.green),
    origin("center"),
    area({ width: 12.5, height: 12.5 }),
    {
      dir: toWorld(mousePos()).sub(player.pos).unit(),
      playerId: player._id,
      isLaunch: false,
      touchWall: 0,
      touchLimit: Math.ceil(player.series / 10),
    },
    "bullet",
  ]);

  bullet.onCollide("wall", (wall) => {
    bullet.touchWall++;

    if (bullet.touchWall > bullet.touchLimit) {
      bullet.destroy();
      return;
    }
    bullet.dir = Vec2.fromAngle(bullet.pos.angle(wall.pos));
  });

  bullet.onCollide("bullet", (otherBullet) => {
    bullet.destroy();
    otherBullet.destroy();
  });

  bullet.onCollide("player", (playerHit) => {
    if (!bullet.isLaunch) {
      bullet.isLaunch = true;
      return;
    }

    if (bullet.playerId === playerHit._id) {
      bullet.destroy();
      addDeath();
      return;
    }

    addKill();
  });
}

onUpdate("bullet", (bullet) => bullet.move(bullet.dir.scale(BULLET_SPEED)));
onKeyPress("space", shoot);
onClick(shoot);
