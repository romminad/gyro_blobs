let tiltX = 0;
let tiltY = 0;

let smoothX = 0;
let smoothY = 0;

let motionEnabled = false;

let motionButton;

let sensitivitySlider;
let sensitivityLabel;

let blobSizeSlider;
let blobSizeLabel;

let blobColorPicker;
let bgColorPicker;


// ----------------------------------------------------
// SETUP
// ----------------------------------------------------

function setup() {

  createCanvas(1800, 950);

  pixelDensity(1);
  noStroke();


  // --------------------------------------------------
  // ENABLE MOTION BUTTON
  // --------------------------------------------------

  motionButton = createButton("ENABLE PHONE MOTION");

  motionButton.position(20, 20);

  motionButton.mousePressed(enableMotion);


  // --------------------------------------------------
  // SENSITIVITY
  // --------------------------------------------------

  sensitivityLabel = createDiv("MOTION 12");

  sensitivityLabel.position(20, 65);

  styleLabel(sensitivityLabel);


  sensitivitySlider = createSlider(
    2,
    30,
    12,
    0.5
  );

  sensitivitySlider.position(20, 88);

  sensitivitySlider.style(
    "width",
    "160px"
  );


  // --------------------------------------------------
  // BLOB SIZE
  // --------------------------------------------------

  blobSizeLabel = createDiv("BLOB SIZE 1.00");

  blobSizeLabel.position(20, 120);

  styleLabel(blobSizeLabel);


  blobSizeSlider = createSlider(
    0.3,
    2.0,
    1.0,
    0.01
  );

  blobSizeSlider.position(20, 143);

  blobSizeSlider.style(
    "width",
    "160px"
  );


  // --------------------------------------------------
  // BACKGROUND
  // --------------------------------------------------

  let bgLabel = createDiv("BG");

  bgLabel.position(20, 178);

  styleLabel(bgLabel);


  bgColorPicker = createColorPicker("#000000");

  bgColorPicker.position(20, 200);


  // --------------------------------------------------
  // SECOND BLOB COLOUR
  // --------------------------------------------------

  let blobLabel = createDiv("BLOB COLOUR");

  blobLabel.position(20, 240);

  styleLabel(blobLabel);


  blobColorPicker = createColorPicker("#888888");

  blobColorPicker.position(20, 262);
}


// ----------------------------------------------------
// DRAW
// ----------------------------------------------------

function draw() {

  background(
    bgColorPicker.color()
  );


  let sensitivity =
    sensitivitySlider.value();

  let blobScale =
    blobSizeSlider.value();


  sensitivityLabel.html(
    "MOTION " +
    sensitivity.toFixed(1)
  );

  blobSizeLabel.html(
    "BLOB SIZE " +
    blobScale.toFixed(2)
  );


  // --------------------------------------------------
  // TARGET MOVEMENT
  // --------------------------------------------------

  let targetX = 0;
  let targetY = 0;


  // --------------------------------------------------
  // PHONE MODE
  // --------------------------------------------------

  if (motionEnabled) {

    targetX =
      tiltX * sensitivity;

    targetY =
      tiltY * sensitivity;

  }


  // --------------------------------------------------
  // MOUSE MODE
  // --------------------------------------------------

  else {

    // Mouse coordinates relative to centre

    let nx =
      (mouseX - width / 2) /
      (width / 2);

    let ny =
      (mouseY - height / 2) /
      (height / 2);


    nx = constrain(
      nx,
      -1,
      1
    );

    ny = constrain(
      ny,
      -1,
      1
    );


    // Maximum movement

    targetX =
      nx * 500;

    targetY =
      ny * 300;
  }


  // --------------------------------------------------
  // SMOOTH INTERPOLATION
  // --------------------------------------------------

  smoothX =
    lerp(
      smoothX,
      targetX,
      0.10
    );

  smoothY =
    lerp(
      smoothY,
      targetY,
      0.10
    );


  // --------------------------------------------------
  // REST POSITION
  //
  // Both blobs overlap in the centre
  // --------------------------------------------------

  let centerX =
    width * 0.5;

  let centerY =
    height * 0.5;


  // --------------------------------------------------
  // REAR / COLOUR BLOB
  //
  // Moves slightly opposite direction
  // --------------------------------------------------

  let blobX =
    centerX -
    smoothX * 0.35;

  let blobY =
    centerY -
    smoothY * 0.35;


  // --------------------------------------------------
  // FRONT / WHITE BLOB
  //
  // Follows the mouse / phone
  // --------------------------------------------------

  let lightX =
    centerX +
    smoothX;

  let lightY =
    centerY +
    smoothY;


  // --------------------------------------------------
  // DRAW REAR BLOB
  // --------------------------------------------------

  drawSoftBlob(
    blobX,
    blobY,
    760 * blobScale,
    blobColorPicker.color()
  );


  // --------------------------------------------------
  // DRAW FRONT BLOB
  // --------------------------------------------------

  drawSoftBlob(
    lightX,
    lightY,
    760 * blobScale,
    color(255)
  );
}


// ----------------------------------------------------
// SOFT RADIAL BLOB
// ----------------------------------------------------

function drawSoftBlob(
  x,
  y,
  radius,
  c
) {

  let ctx =
    drawingContext;


  let gradient =
    ctx.createRadialGradient(
      x,
      y,
      0,
      x,
      y,
      radius
    );


  gradient.addColorStop(
    0.00,
    rgba(c, 1.0)
  );

  gradient.addColorStop(
    0.18,
    rgba(c, 0.98)
  );

  gradient.addColorStop(
    0.42,
    rgba(c, 0.78)
  );

  gradient.addColorStop(
    0.68,
    rgba(c, 0.36)
  );

  gradient.addColorStop(
    0.86,
    rgba(c, 0.10)
  );

  gradient.addColorStop(
    1.00,
    rgba(c, 0.0)
  );


  ctx.fillStyle =
    gradient;


  ctx.fillRect(
    0,
    0,
    width,
    height
  );
}


// ----------------------------------------------------
// PHONE ORIENTATION
// ----------------------------------------------------

function handleOrientation(event) {

  // --------------------------------------------------
  // LEFT / RIGHT
  // --------------------------------------------------

  if (event.gamma !== null) {

    tiltX =
      constrain(
        event.gamma,
        -30,
        30
      );
  }


  // --------------------------------------------------
  // FORWARD / BACK
  // --------------------------------------------------

  if (event.beta !== null) {

    let adjustedBeta =
      event.beta - 45;


    tiltY =
      constrain(
        adjustedBeta,
        -30,
        30
      );
  }
}


// ----------------------------------------------------
// ENABLE PHONE SENSOR
// ----------------------------------------------------

async function enableMotion() {

  try {

    // ------------------------------------------------
    // iPhone / iPad permission
    // ------------------------------------------------

    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {

      let permission =
        await DeviceOrientationEvent.requestPermission();


      if (permission !== "granted") {

        motionButton.html(
          "MOTION PERMISSION DENIED"
        );

        return;
      }
    }


    // ------------------------------------------------
    // START LISTENING
    // ------------------------------------------------

    window.addEventListener(
      "deviceorientation",
      handleOrientation
    );


    motionEnabled = true;


    motionButton.html(
      "PHONE MOTION ON"
    );

  }

  catch (error) {

    console.error(error);

    motionButton.html(
      "MOTION ERROR"
    );
  }
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

  el.style(
    "color",
    "white"
  );

  el.style(
    "font-family",
    "Arial, sans-serif"
  );

  el.style(
    "font-size",
    "11px"
  );

  el.style(
    "letter-spacing",
    "1px"
  );
}