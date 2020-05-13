var videoScorce = "matrixRain.mp4";
var video = document.createElement("video");
function fileOnChange(input) {
  var reader = new FileReader();
  var url = URL.createObjectURL(input.files[0]);

  video.src = url;
  video.setAttribute("loop", "true");
  video.setAttribute("preload", "true");
  video.setAttribute("autoplay", "true");
  var videoTexture = new THREE.VideoTexture(video);
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.minFilter = THREE.LinearFilter;

  //JEEFACEFILTERAPI.update_videoElement(video, () => {});

  /* videoScorce = document.getElementById("fileInput").value;
  var video = document.createElement("video");
  video.src = videoScorce;
  video.setAttribute("loop", "true");
  video.setAttribute("preload", "true");
  video.setAttribute("autoplay", "true");
  JEEFACEFILTERAPI.update_videoElement(video, () => {});*/
}

function main() {
  //initialize Jeeliz Facefilter :
  JEEFACEFILTERAPI.init({
    canvasId: "matrixCanvas",
    //path of NNC.json, which is the neural network model:
    NNCpath: "https://appstatic.jeeliz.com/faceFilter/",
    callbackReady: function (errCode, initState) {
      if (errCode) {
        console.log("AN ERROR HAPPENS BRO =", errCode);
        return;
      }
      console.log("JEEFACEFILTER WORKS YEAH !");
      init_scene(initState);
    }, //end callbackReady()

    callbackTrack: callbackTrack,
  });
}

function init_scene(initState) {
  var threeInstances = THREE.JeelizHelper.init(initState);

  //create the 20 degrees FoV camera:
  var aspecRatio =
    initState.canvasElement.width / initState.canvasElement.height;
  THREECAMERA = new THREE.PerspectiveCamera(20, aspecRatio, 0.1, 100);

  //create the background video texture :

  video.src = videoScorce;
  video.setAttribute("loop", "true");
  video.setAttribute("preload", "true");
  video.setAttribute("autoplay", "true");
  var videoTexture = new THREE.VideoTexture(video);
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.minFilter = THREE.LinearFilter;

  threeInstances.videoMesh.material.uniforms.samplerVideo.value = videoTexture;

  try {
    //small trick otherwise Chrome sometimes do not start the video
    video.play(); //not in the tuto
  } catch (e) {}
  var playVideo = function () {
    video.play();
    window.removeEventListener("mousemove", playVideo);
    window.removeEventListener("touchmove", playVideo);
  };
  window.addEventListener("mousedown", playVideo, false);
  window.addEventListener("touchdown", playVideo, false);

  //import the mesh:
  new THREE.BufferGeometryLoader().load("maskMesh.json", function (
    maskGeometry
  ) {
    maskGeometry.computeVertexNormals();
    //var maskMaterial=new THREE.MeshNormalMaterial();

    //creation the custom material:
    var maskMaterial = new THREE.ShaderMaterial({
      vertexShader:
        "\n\
	    varying vec3 vNormalView, vPosition;\n\
	    void main(void){\n\
	      #include <beginnormal_vertex>\n\
	      #include <defaultnormal_vertex>\n\
	      #include <begin_vertex>\n\
	      #include <project_vertex>\n\
	      vNormalView=vec3(viewMatrix*vec4(normalize( transformedNormal ),0.));\n\
		  vPosition=position;\n\
	    }",

      fragmentShader:
        "precision lowp float;\n\
	    uniform vec2 resolution;\n\
	    uniform sampler2D samplerWebcam, samplerVideo;\n\
	    varying vec3 vNormalView, vPosition;\n\
	    void main(void){\n\
			vec2 uv=gl_FragCoord.xy/resolution;\n\
			vec3 colorWebcam=texture2D(samplerWebcam, uv).rgb;\n\
			vec3 finalColor=colorWebcam;\n\
			gl_FragColor=vec4(finalColor, 1.); //1 for alpha channel\n\
		  }",

      uniforms: {
        samplerWebcam: { value: THREE.JeelizHelper.get_threeVideoTexture() },
        samplerVideo: { value: videoTexture },
        resolution: {
          value: new THREE.Vector2(
            initState.canvasElement.width,
            initState.canvasElement.height
          ),
        },
      },
    });

    var maskMesh = new THREE.Mesh(maskGeometry, maskMaterial);
    maskMesh.position.set(0, 0.2, -0.2);
    threeInstances.faceObject.add(maskMesh);

    THREE.JeelizHelper.apply_videoTexture(maskMesh);
  });
}

function callbackTrack(detectState) {
  //console.log(detectState.detected);
  THREE.JeelizHelper.render(detectState, THREECAMERA);
}
