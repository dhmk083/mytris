const range = n => [...Array(n).keys()];

const clamp = (x, min, max) => Math.max(min, Math.min(max, x));

const pickRandom = arr => arr[~~(Math.random() * arr.length)];

function withTranslate(ctx, [x, y], fn) {
  try {
    ctx.translate(x, y);
    fn(ctx);
  } finally {
    ctx.translate(-x, -y);
  }
}
