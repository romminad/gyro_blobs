let fontMain;

let rawGamma = 0;
let rawBeta = 0;

let neutralGamma = 0;
let neutralBeta = 0;

let tiltX = 0;
let tiltY = 0;

let smoothX = 0;
let smoothY = 0;

let motionEnabled = false;
let hasOrientationData = false;

let motionButton;
let calibrateButton;

let sensitivitySlider;
let sensitivityLabel;

let blobSizeSlider;
let blobSizeLabel;

let blobColorPicker;
let bgColorPicker;

let blurLayer;

// fixed settings
const LETTER = "A";
const LETTER_SIZE_FACTOR = 0.42;
const BLUR_AMOUNT = 48; // fixed "maximum" blur


// ----------------------------------------------------
// PRELOAD
// ----------------------------------------------------

function preload() {
  fontMain = loadFont("CironVariableUnlicensedTrialVersion-CironVariable.ttf");
}


// ----------------------------------------------------
// SETUP
// ----------------------------------------------------

function setup() {
  createCanvas(windowWidth, windowHeight);

  pixelDensity(1);
  noStroke();
  textAlign(CENTER, CENTER);
  textFont(fontMain);

  blurLayer = createGraphics(windowWidth, windowHeight);
  blurLayer.pixelDensity(1);
  blurLayer.textAlign(CENTER, CENTER);
  blurLayer.textFont(fontMain);

  // --------------------------------------------------
  // ENABLE MOTION
  // --------------------------------------------------

  motionButton = createButton("ENABLE PHONE MOTION");
  motionButton.position(20, 20);
  motionButton.mousePressed(enableMotion);

  // --------------------------------------------------
  // CALIBRATE
  // --------------------------------------------------

  calibrateButton = createButton("CALIBRATE");
  calibrateButton.position(20, 52);
  calibrateButton.mousePressed(calibrateMotion);
  calibrateButton.hide();

  // --------------------------------------------------
  // SENSITIVITY
  // --------------------------------------------------

  sensitivityLabel = createDiv("MOTION 12");
  sensitivityLabel.position(20, 92);
  styleLabel(sensitivityLabel);

  sensitivitySlider = createSlider(2, 30, 12, 0.5);
  sensitivitySlider.position(20, 115);
  sensitivitySlider.style("width", "160px");

  // --------------------------------------------------
  // BLOB SIZE
  // --------------------------------------------------

  blobSizeLabel = createDiv("BLOB SIZE 1.00");
  blobSizeLabel.position(20, 147);
  styleLabel(blobSizeLabel);

  blobSizeSlider = createSlider(0.3, 2.0, 1.0, 0.01);
  blobSizeSlider.position(20, 170);
  blobSizeSlider.style("width", "160px");

  // --------------------------------------------------
  // BG
  // --------------------------------------------------

  let bgLabel = createDiv("BG");
  bgLabel.position(20, 205);
  styleLabel(bgLabel);

  bgColorPicker = createColorPicker("#000000");
  bgColorPicker.position(20, 227);

  // --------------------------------------------------
  // BLOB COLOUR
  // --------------------------------------------------

  let blobLabel = createDiv("BLOB COLOUR");
  blobLabel.position(20, 267);
  styleLabel(blobLabel);

  blobColorPicker = createColorPicker("#888888");
  blobColorPicker.position(20, 289);
}


// ----------------------------------------------------
// DRAW
// ----------------------------------------------------

function draw() {
  background(bgColorPicker.color());

  let sensitivity = sensitivitySlider.value();
  let blobScale = blobSizeSlider.value();

  sensitivityLabel.html("MOTION " + sensitivity.toFixed(1));
  blobSizeLabel.html("BLOB SIZE " + blobScale.toFixed(2));

  let baseBlobSize = min(width, height) * 1.05;

  // --------------------------------------------------
  // TARGET MOVEMENT
  // --------------------------------------------------

  let targetX = 0;
  let targetY = 0;

  if (motionEnabled) {
    targetX = tiltX * sensitivity;
    targetY = tiltY * sensitivity;
  } else {
    let nx = (mouseX - width / 2) / (width / 2);
    let ny = (mouseY - height / 2) / (height / 2);

    nx = constrain(nx, -1, 1);
    ny = constrain(ny, -1, 1);

    targetX = nx * width * 0.28;
    targetY = ny * height * 0.28;
  }

  // --------------------------------------------------
  // SMOOTH MOVEMENT
  // --------------------------------------------------

  smoothX = lerp(smoothX, targetX, 0.08);
  smoothY = lerp(smoothY, targetY, 0.08);

  // --------------------------------------------------
  // CENTRE POSITION
  // --------------------------------------------------

  let centerX = width * 0.5;
  let centerY = height * 0.5;

  // rear blob
  let blobX = centerX - smoothX * 0.35;
  let blobY = centerY - smoothY * 0.35;

  // front / white blob
  let lightX = centerX + smoothX;
  let lightY = centerY + smoothY;

  // --------------------------------------------------
  // DRAW BLOBS
  // --------------------------------------------------

  drawSoftBlob(
    blobX,
    blobY,
    baseBlobSize * blobScale,
    blobColorPicker.color()
  );

  drawSoftBlob(
    lightX,
    lightY,
    baseBlobSize * blobScale,
    color(255)
  );

  // --------------------------------------------------
  // LETTER
  // --------------------------------------------------

  let letterSize = min(width, height) * LETTER_SIZE_FACTOR;

  drawBaseLetter(centerX, centerY, letterSize);
  drawBlurredLetter(centerX, centerY, letterSize, lightX, lightY, blobScale);
}


// ----------------------------------------------------
// BASE LETTER
// ----------------------------------------------------

function drawBaseLetter(x, y, size) {
  push();
  textFont(fontMain);
  textAlign(CENTER, CENTER);
  textSize(size);
  noStroke();
  fill(255, 230);
  text(LETTER, x, y);
  pop();
}


// ----------------------------------------------------
// BLURRED LETTER
// blur is fixed at maximum and only appears
// where the white blob passes
// ----------------------------------------------------

function drawBlurredLetter(centerX, centerY, letterSize, lightX, lightY, blobScale) {
  blurLayer.clear();
  blurLayer.textFont(fontMain);
  blurLayer.textAlign(CENTER, CENTER);
  blurLayer.textSize(letterSize);
  blurLayer.noStroke();

  let ctx = blurLayer.drawingContext;

  // blurred pass 1
  ctx.save();
  ctx.filter = `blur(${BLUR_AMOUNT}px)`;
  blurLayer.fill(255, 180);
  blurLayer.text(LETTER, centerX, centerY);
  ctx.restore();

  // blurred pass 2 for extra bloom
  ctx.save();
  ctx.filter = `blur(${BLUR_AMOUNT * 1.6}px)`;
  blurLayer.fill(255, 75);
  blurLayer.text(LETTER, centerX, centerY);
  ctx.restore();

  // mask blur with the white blob position
  ctx.save();
  ctx.globalCompositeOperation = "destination-in";

  let maskRadius = min(width, height) * 0.55 * blobScale;

  let gradient = ctx.createRadialGradient(
    lightX, lightY, 0,
    lightX, lightY, maskRadius
  );

  gradient.addColorStop(0.00, "rgba(0,0,0,1)");
  gradient.addColorStop(0.35, "rgba(0,0,0,0.98)");
  gradient.addColorStop(0.70, "rgba(0,0,0,0.38)");
  gradient.addColorStop(1.00, "rgba(0,0,0,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();

  image(blurLayer, 0, 0);
}


// ----------------------------------------------------
// SOFT BLOB
// ----------------------------------------------------

function drawSoftBlob(x, y, radius, c) {
  let ctx = drawingContext;

  let gradient = ctx.createRadialGradient(
    x, y, 0,
    x, y, radius
  );

  gradient.addColorStop(0.00, rgba(c, 1.0));
  gradient.addColorStop(0.18, rgba(c, 0.98));
  gradient.addColorStop(0.42, rgba(c, 0.78));
  gradient.addColorStop(0.68, rgba(c, 0.36));
  gradient.addColorStop(0.86, rgba(c, 0.10));
  gradient.addColorStop(1.00, rgba(c, 0.0));

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}


// ----------------------------------------------------
// PHONE ORIENTATION
// ----------------------------------------------------

function handleOrientation(event) {
  if (event.gamma === null || event.beta === null) return;

  rawGamma = event.gamma;
  rawBeta = event.beta;
  hasOrientationData = true;

  let differenceGamma = rawGamma - neutralGamma;
  let differenceBeta = rawBeta - neutralBeta;

  tiltX = constrain(differenceGamma, -30, 30);
  tiltY = constrain(differenceBeta, -30, 30);
}


// ----------------------------------------------------
// CALIBRATE
// ----------------------------------------------------

function calibrateMotion() {
  if (!hasOrientationData) return;

  neutralGamma = rawGamma;
  neutralBeta = rawBeta;

  tiltX = 0;
  tiltY = 0;
  smoothX = 0;
  smoothY = 0;

  calibrateButton.html("CALIBRATED");

  setTimeout(() => {
    calibrateButton.html("CALIBRATE");
  }, 800);
}


// ----------------------------------------------------
// ENABLE PHONE SENSOR
// ----------------------------------------------------

async function enableMotion() {
  try {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      let permission = await DeviceOrientationEvent.requestPermission();

      if (permission !== "granted") {
        motionButton.html("MOTION PERMISSION DENIED");
        return;
      }
    }

    window.addEventListener("deviceorientation", handleOrientation);

    motionEnabled = true;
    motionButton.html("PHONE MOTION ON");
    calibrateButton.show();

    setTimeout(() => {
      if (hasOrientationData) calibrateMotion();
    }, 500);

  } catch (error) {
    console.error(error);
    motionButton.html("MOTION ERROR");
  }
}


// ----------------------------------------------------
// RESIZE
// ----------------------------------------------------

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  blurLayer = createGraphics(windowWidth, windowHeight);
  blurLayer.pixelDensity(1);
  blurLayer.textAlign(CENTER, CENTER);
  blurLayer.textFont(fontMain);
}


// ----------------------------------------------------
// UTILS
// ----------------------------------------------------

function rgba(c, alpha) {
  return (
    "rgba(" +
    red(c) + "," +
    green(c) + "," +
    blue(c) + "," +
    alpha +
    ")"
  );
}

function styleLabel(el) {
  el.style("color", "white");
  el.style("font-family", "Arial, sans-serif");
  el.style("font-size", "11px");
  el.style("letter-spacing", "1px");
}