// Load Model
const detectorConfig = {
    runtime: 'tfjs',
    enableSmoothing: true,
    modelType: "full",
    detectorModelUrl: "https://heibbs.oss-cn-hongkong.aliyuncs.com/live3d/blazepose/detector/model.json",
    landmarkModelUrl: "https://heibbs.oss-cn-hongkong.aliyuncs.com/live3d/blazepose/model.json",
};
let detector = undefined;
let ready_state = false;
async function load_model() {
    detector = await poseDetection.createDetector(poseDetection.SupportedModels.BlazePose, detectorConfig);
    get_pose();
}
load_model();
let canvas = document.getElementById("pic");
let ctx = canvas.getContext('2d');
let poses = null;
async function get_pose(){
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const estimationConfig = {flipHorizontal: true};
    const timestamp = performance.now();
    poses = await detector.estimatePoses(canvas, estimationConfig, timestamp);
    //poses = poses.keypoints3D;
    setTimeout(get_pose, 100);
}

//Load 3D Model
const url = './3dmodel/guotang/guotang.pmx'
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
camera.position.z = 30;
camera.position.y = 10;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xf0f0f0);
angle = null;
document.body.appendChild(renderer.domElement);
const loader = new THREE.MMDLoader();
// 左肩 右肩 左腿 右腿
loader.load(
    url,
    function (mesh) {
        console.log(mesh);
        scene.add(mesh);
    },
    function(){

    },
    function(){

    }
);
const light = new THREE.AmbientLight(0x404040, 2.9);
scene.add(light);
n  = 0
finnal = 0;
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    if(poses !== null && poses[0] !== undefined && poses[0].score > 0.91){
        console.log(poses[0].score)
        pose = poses[0].keypoints3D;
        // 右肩操作
        result = get_angle(pose[13],pose[11])
        result.z = result.z + 1 - Math.PI/2;
        result.x = -result.x
        result.y = -result.y
        change_position(get_bones_from_name("右肩").position, result);

        // 左肩操作
        result = get_angle(pose[14],pose[12])
        result.z = result.z - 1 + Math.PI/2;
        change_position(get_bones_from_name("左肩").position, result);

        // 右关节操作
        result = get_angle(pose[15],pose[13])
        result.z = result.z + 1 - Math.PI/2;
        result.x = -result.x
        result.y = -result.y
        change_position(get_bones_from_name("右ひじ").position, result);

        // 左关节操作
        result = get_angle(pose[16],pose[14])
        result.z = result.z - 1 + Math.PI/2;
        change_position(get_bones_from_name("左ひじ").position, result);


    }
}
window.onresize = function(){
    camera.aspect =  window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    document.clear();
    renderer.setSize(window.innerWidth, window.innerHeight);
};

//Change Position
function get_bones_from_name(name){
    bones = scene.children[1].skeleton.bones;
    for(i=0; i<bones.length; i++){
        if(bones[i].name === name){
            return {bones: bones[i], position: i};
        }
    }
}
function change_position(bones_number, {x: x=null, y: y=null, z: z=null}){
    if(x !== null){
        scene.children[1].skeleton.bones[bones_number].rotation.x = x
    }
    if(y !== null){
        scene.children[1].skeleton.bones[bones_number].rotation.y = y
    }
    if(z !== null){
        scene.children[1].skeleton.bones[bones_number].rotation.z = z
    }
}

//Angle Cal
function get_angle({x:x1, y:y1, z:z1},{x:x2, y:y2, z:z2}){
    k = (y2-y1) / (x2-x1)
    z = Math.atan(k);
    k = (z2-z1) / (x2-x1)
    y = Math.atan(k);
    k = (z2-z1) / (y2-y1)
    x = Math.atan(k);
    return {x: x, y: y, z: z};
}


animate();