var _img = document.getElementById('squat');
var newImg = new Image;
newImg.onload = function() {
  _img.src = this.src;
}
var imgPath = document.currentScript.getAttribute('path').substring(6);
console.log(imgPath);
newImg.src = imgPath;

var imageScaleFactor = 0.5;
var outputStride = 16;
var flipHorizontal = false;

var imageElement = document.getElementById('squat');

const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');

const videoWidth = 600;
console.log(videoWidth)
const videoHeight = 500;
console.log(videoHeight)

canvas.width = videoHeight;
canvas.height = videoHeight;

ctx.clearRect(0, 0, videoWidth, videoHeight);

ctx.save();
ctx.scale(-1, 1);
ctx.translate(-videoWidth, 0);
ctx.drawImage(imageElement, 0, 0, videoWidth, videoHeight);
ctx.restore();

// Variables needed for Drawing functions
var minPoseConfidence = 0.1;
var minPartConfidence = 0.5;

const color = 'aqua';
const boundingBoxColor = 'red';
const lineWidth = 2;

let poses = [];
posenet.load().then(function(net){
  return net.estimateSinglePose(imageElement, imageScaleFactor, flipHorizontal, outputStride)
}).then(function(pose){
  console.log(pose);

  left_wrist = new Array(pose.keypoints[9].position.x, pose.keypoints[9].position.y);
  left_ankle = new Array(pose.keypoints[15].position.x, pose.keypoints[15].position.y);

  // Get depth points
  left_knee = new Array(pose.keypoints[13].position.x, pose.keypoints[13].position.y);
  left_hip = new Array(pose.keypoints[11].position.x, pose.keypoints[11].position.y);

  poses.push(pose);

  poses.forEach(({score, keypoints}) => {
    if (score >= minPoseConfidence) {
      drawKeypoints(keypoints, minPartConfidence, ctx);
      drawSkeleton(keypoints, minPartConfidence, ctx);
      // drawBoundingBox(keypoints, ctx);
    }
  });

  return checkValues(left_wrist, left_ankle, left_hip, left_knee)
});


function toTuple({y, x}) {
  return [y, x];
}

function drawPoint(ctx, y, x, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawKeypoints(keypoints, minConfidence, ctx, scale = 1) {
  for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i];

    if (keypoint.score < minConfidence) {
      continue;
    }

    const {y, x} = keypoint.position;
    drawPoint(ctx, y * scale, x * scale, 3, color);
  }
}

/**
 * Draws a line on a canvas, i.e. a joint
 */
function drawSegment([ay, ax], [by, bx], color, scale, ctx) {
  ctx.beginPath();
  ctx.moveTo(ax * scale, ay * scale);
  ctx.lineTo(bx * scale, by * scale);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function drawSkeleton(keypoints, minConfidence, ctx, scale = 1) {
  const adjacentKeyPoints = posenet.getAdjacentKeyPoints(
    keypoints, minConfidence);

  adjacentKeyPoints.forEach((keypoints) => {
    drawSegment(toTuple(keypoints[0].position),
      toTuple(keypoints[1].position), color, scale, ctx);
  });
}

// Determine if points fall within margin of error
function checkValues(left_wrist, left_ankle, left_hip, left_knee) {
  var good = true;
  var str = ""
  // Check bar and feet alignment
  if (Math.abs(left_wrist[0]-left_ankle[0]) > 50) {
    str = "You need to align your bar with the middle of your feet for proper balance! ";
    // document.getElementById("feedback").innerHTML = str;
    good = false;
  }
    // Check depth of motion
  if (left_knee[1]-left_hip[1] > 15) {
    str += "You need to lower your hips below your knees for a full range of motion! ";
    //document.getElementById("feedback").innerHTML = str;
    good = false;
  }
  if (good) {
    str = "You have good form!";
  }
  document.getElementById("feedback").innerHTML = str;
  console.log("Done")
}