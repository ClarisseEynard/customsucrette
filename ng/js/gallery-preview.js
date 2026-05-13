/**
 * Rendu des aperçus de tenues NG dans la galerie
 */

const HAIR_COLORS = [
  "black",
  "blond",
  "blue",
  "brown",
  "light_blue",
  "orange",
  "pink",
  "purple",
  "red",
  "white",
];

const EYE_COLORS = [
  "black",
  "blue",
  "brown",
  "green",
  "brown_green",
  "light_blue",
  "light_green",
  "pink",
  "purple",
  "red",
  "yellow",
];

const SKIN_FROM_CODE = {
  R: "rose",
  T: "tulip",
  M: "marigold",
  H: "hortensia",
  O: "orchid",
  L: "lys",
  P: "pansy",
};

let previewReady = null;
let cloth = [];
let avatar = {};
let room = [];
let pet = [];
let crush = [];

function initGalleryPreview() {
  if (!previewReady) {
    previewReady = Promise.all([
      $.getJSON("./data/cloth.json"),
      $.getJSON("./data/avatar.json"),
      $.getJSON("./data/room.json"),
      $.getJSON("./data/pet.json"),
      $.getJSON("./data/crush.json"),
    ]).then(([dbCloth, dbAvatar, dbRoom, dbPet, dbCrush]) => {
      cloth = dbCloth;
      avatar = dbAvatar;
      room = dbRoom;
      pet = dbPet;
      crush = dbCrush;
    });
  }
  return previewReady;
}

function preloadIMG(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Image introuvable: ${src}`));
    img.src = src;
  });
}

function composeCanvasUrl(state, size, value, layer = null) {
  const base = "https://assets.corazondemelon-newgen.es/";
  if (layer == null) {
    return `${base}cloth/full/${size}/${value}.png`;
  }
  const [id, security] = value.split("-");
  return `${base}cloth/full/${size}/${id}-${layer}-${security}.png`;
}

function composeAvatarUrl(state, part, size, data, map = null) {
  const base = "https://assets.corazondemelon-newgen.es/avatar-part/";
  const expressions =
    state.avatar.expressionPreset !== "auto"
      ? avatar.expressionsPresets[state.avatar.expressionPreset]
      : [
          state.avatar.expression.eyebrow,
          state.avatar.expression.eye,
          state.avatar.expression.mouth,
        ];

  if (part === "skin") {
    return `${base}skin/full/${size}/${data}.png`;
  }

  if (part === "hair") {
    return `${base}hair/full/${size}/${data}-${map}.png`;
  }

  const [partId, security] = data.split("-");

  if (part === "eyes_skin") {
    const body = state.avatar.customSkin == null ? state.avatar.skin : "no";
    return `${base}eyes/full/${size}/${partId}-body_${body}-${expressions[1]}-${security}.png`;
  }

  if (part === "eyes") {
    return `${base}eyes/full/${size}/${partId}-eyes_${state.avatar.eyesColor}-${expressions[1]}-${security}.png`;
  }

  if (part === "eyebrows_skin") {
    const body = state.avatar.customSkin == null ? state.avatar.skin : "no";
    return `${base}eyebrows/full/${size}/${partId}-body_${body}-${expressions[0]}-${security}.png`;
  }

  if (part === "eyebrows") {
    return `${base}eyebrows/full/${size}/${partId}-hair_${state.avatar.hair}-${expressions[0]}-${security}.png`;
  }

  if (part === "mouth") {
    const body = state.avatar.customSkin == null ? state.avatar.skin : "no";
    return `${base}mouth/full/${size}/${partId}-body_${body}-${expressions[2]}-${security}.png`;
  }

  return "";
}

function composeRoomBackgroundUrl(background) {
  if (!background) return null;
  const [id, security] = background.split("-");
  return `https://assets.corazondemelon-newgen.es/room-item/image/full/sd/${id}-day-${security}.jpg`;
}

async function drawLayer(ctx, url, width, height) {
  if (!url) return;
  try {
    const img = await preloadIMG(url);
    ctx.drawImage(img, 0, 0, width, height);
  } catch (e) {
    console.warn(e.message);
  }
}

async function drawAvatarBase(ctx, state, size, width, height) {
  const skinUrl =
    state.avatar.customSkin == null
      ? composeAvatarUrl(state, "skin", size, state.avatar.skin)
      : composeCanvasUrl(state, size, state.avatar.customSkin);

  await drawLayer(ctx, skinUrl, width, height);
  await drawLayer(ctx, composeAvatarUrl(state, "mouth", size, state.avatar.mouth), width, height);
  await drawLayer(ctx, composeAvatarUrl(state, "eyes_skin", size, state.avatar.eyes), width, height);
  await drawLayer(ctx, composeAvatarUrl(state, "eyes", size, state.avatar.eyes), width, height);
  await drawLayer(
    ctx,
    composeAvatarUrl(state, "eyebrows_skin", size, state.avatar.eyebrows),
    width,
    height,
  );
  await drawLayer(ctx, composeAvatarUrl(state, "eyebrows", size, state.avatar.eyebrows), width, height);
}

function parseNgCode(code) {
  try {
    const parts = code.split("i");
    let x = 1;
    const state = {
      avatar: {
        skin: "hortensia",
        hair: "brown",
        eyebrows: "1-5b720362ccbfc015",
        eyesColor: "brown",
        eyes: "1-c8f85ec8f0f3ab2d",
        mouth: "2-d52f3502c5814f22",
        expressionPreset: "auto",
        expression: { eyebrow: "H_Mid", eye: "N_Open_FrontLook", mouth: "H_Closed" },
        customSkin: null,
      },
      orderInfo: [],
      room: {
        background: null,
        slot1: null,
        slot2: null,
        slot3: null,
        slot4: null,
        slot5: null,
      },
      pet: { status: false, outfit: null },
      crush: { outfit: null, position: "back" },
    };

    const cPet = parts[x].split("T");
    state.pet.status = cPet[0] === "1";
    if (cPet[1] !== "0") {
      const p = pet.filter((v) => v.id == cPet[1]);
      if (p.length) state.pet.outfit = `${cPet[1]}-${p[0].security}`;
    }
    x++;

    if (parts[x].includes("C")) {
      const cCrush = parts[x].split("C");
      state.crush.position = cCrush[0] === "0" ? "back" : "front";
      if (cCrush[1] !== "0") {
        const o = crush.filter((v) => v.id == cCrush[1]);
        if (o.length) state.crush.outfit = `${cCrush[1]}-${o[0].security}`;
      }
      x++;
    }

    const cRoom = parts[x].split("S");
    const pickRoom = (id) => {
      const item = room.filter((v) => v.id == id);
      return item.length === 1 ? `${id}-${item[0].security}` : null;
    };

    state.room.background = pickRoom(cRoom[0]);
    state.room.slot1 = pickRoom(cRoom[1]);
    state.room.slot2 = pickRoom(cRoom[2]);
    state.room.slot3 = pickRoom(cRoom[3]);
    state.room.slot4 = pickRoom(cRoom[4]);
    state.room.slot5 = pickRoom(cRoom[5]);
    x++;

    parts.splice(0, x);

    for (let z = 0; z < parts.length; z++) {
      const segment = parts[z];
      if (!segment) continue;

      if (segment.includes("A")) {
        const tAvatar = segment.split("A");
        state.avatar.skin = SKIN_FROM_CODE[tAvatar[0][0]] || "hortensia";

        if (tAvatar[0].length > 1) {
          const cs = tAvatar[0].slice(1);
          const temp = cloth.filter((v) => v.variations.some((i) => i.id == cs));
          if (temp.length) state.avatar.customSkin = `${cs}-${temp[0].security}`;
        } else {
          state.avatar.customSkin = null;
        }

        state.avatar.hair = HAIR_COLORS[parseInt(tAvatar[1], 10)] || "brown";
        state.avatar.eyesColor = EYE_COLORS[parseInt(tAvatar[2], 10)] || "brown";

        let temp = avatar.collections.eyes.filter((v) =>
          v.variations.some((i) => i.id == tAvatar[3]),
        );
        if (temp.length) state.avatar.eyes = `${tAvatar[3]}-${temp[0].security}`;

        temp = avatar.collections.eyebrows.filter((v) =>
          v.variations.some((i) => i.id == tAvatar[4]),
        );
        if (temp.length) state.avatar.eyebrows = `${tAvatar[4]}-${temp[0].security}`;

        temp = avatar.collections.mouth.filter((v) =>
          v.variations.some((i) => i.id == tAvatar[5]),
        );
        if (temp.length) state.avatar.mouth = `${tAvatar[5]}-${temp[0].security}`;

        const tExpr = tAvatar[6].split("X");
        state.avatar.expressionPreset = "auto";
        state.avatar.expression.eyebrow = avatar.expressions.eyebrow[tExpr[0]];
        state.avatar.expression.eye = avatar.expressions.eye[tExpr[1]];
        state.avatar.expression.mouth = avatar.expressions.mouth[tExpr[2]];

        state.orderInfo.push({ category: "avatar", layer: null, value: null });
      } else {
        const id = segment.slice(1);
        let layer = segment.slice(0, 1);
        layer = layer === "M" ? null : layer === "B" ? "back" : "front";

        if (id === "H") {
          state.orderInfo.push({ category: "hair", layer, value: "auto" });
        } else {
          const item = cloth.filter((v) => v.variations.some((i) => i.id == id));
          if (!item.length) continue;
          state.orderInfo.push({
            category: item[0].category,
            layer,
            value: `${id}-${item[0].security}`,
          });
        }
      }
    }

    return state;
  } catch (e) {
    console.warn("parseNgCode", e);
    return null;
  }
}

async function drawSucrettePortrait(ctx, state, size, canvasW, canvasH) {
  const portraitW = 1200;
  const portraitH = 1550;
  const off = document.createElement("canvas");
  off.width = portraitW;
  off.height = portraitH;
  const octx = off.getContext("2d");

  for (const item of state.orderInfo) {
    if (item.category === "avatar") {
      await drawAvatarBase(octx, state, size, portraitW, portraitH);
    } else if (item.category === "hair") {
      await drawLayer(
        octx,
        composeAvatarUrl(state, "hair", size, state.avatar.hair, item.layer),
        portraitW,
        portraitH,
      );
    } else {
      const entry = cloth.filter((v) => v.security === item.value.split("-")[1]);
      if (!entry.length) continue;

      if (!entry[0].multiLayered) {
        await drawLayer(octx, composeCanvasUrl(state, size, item.value), portraitW, portraitH);
      } else {
        await drawLayer(
          octx,
          composeCanvasUrl(state, size, item.value, item.layer),
          portraitW,
          portraitH,
        );
      }
    }
  }

  const scale = Math.min(canvasW / portraitW, canvasH / portraitH);
  const drawW = portraitW * scale;
  const drawH = portraitH * scale;
  const drawX = (canvasW - drawW) / 2;
  const drawY = canvasH - drawH;

  ctx.drawImage(off, drawX, drawY, drawW, drawH);
}

async function renderCardPreview(canvas, code) {
  await initGalleryPreview();

  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  if (!code || code[0] !== "3") {
    ctx.fillStyle = "#aaa";
    ctx.font = "13px Tahoma, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Aperçu NG uniquement", w / 2, h / 2);
    return;
  }

  const state = parseNgCode(code);
  if (!state) {
    ctx.fillStyle = "#c66";
    ctx.font = "13px Tahoma, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Code invalide", w / 2, h / 2);
    return;
  }

  const bgUrl = composeRoomBackgroundUrl(state.room.background);
  if (bgUrl) {
    try {
      const bg = await preloadIMG(bgUrl);
      const scale = Math.max(w / bg.width, h / bg.height);
      const bw = bg.width * scale;
      const bh = bg.height * scale;
      const bx = (w - bw) / 2;
      const by = (h - bh) / 2;
      ctx.drawImage(bg, bx, by, bw, bh);
    } catch (e) {
      console.warn(e.message);
    }
  }

  await drawSucrettePortrait(ctx, state, "sd", w, h);
}
