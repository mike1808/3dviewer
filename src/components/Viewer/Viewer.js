import React, {Component} from "react";
import Divider from "material-ui/Divider";

import * as THREE from "three";
import MTLLoader from "../../loaders/MTLLoader";
import OBJLoader from "../../loaders/OBJLoader";

import MeshUpload from "../MeshUpload/MeshUpload";
import CameraControls from "../CameraControls/CameraControls";

const promisifyLoad = (loader) => {
  function onProgress(xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  }

  return url => new Promise((resolve, reject) => {
    loader.load(url, resolve, onProgress, reject);
  });
};

class Viewer extends Component {
  init = () => {
    const { width, height} = this.getRendererSize();

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.001, 1000);
    this.camera.position.z = 2.;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(width, height);

    this.ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(this.ambientLight);

    this.pointLight = new THREE.PointLight(0xffffff, 1.); // this should dependant on the mesh size
    this.pointLight.position.set(0, 0, 0);
    this.scene.add(this.pointLight);

    this.root.appendChild(this.renderer.domElement);

    window.addEventListener('resize', this.handleResize);
  };

  animate = () => {
    requestAnimationFrame(this.animate);

    this.mesh.rotation.y += 0.02;

    this.renderer.render(this.scene, this.camera);
  };

  handleResize = () => {
    const { width, height} = this.getRendererSize();
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  };

  loadMaterial(materialUri, textures) {
    const mtlLoader = new MTLLoader();
    const texturePathMap = {};

    textures.forEach(texture => {
      texturePathMap[texture.name] = texture.uri;
    });

    mtlLoader.setMaterialOptions({texturePathMap});

    return promisifyLoad(mtlLoader)(materialUri)
      .then((materials) => {
        materials.preload();
        return materials;
      });
  }

  getRendererSize() {
    const p = 0.9;
    const width = window.innerWidth * p;
    const height = window.innerHeight * p;

    return {width, height};
  }

  loadObject(objectUri, materials) {
    const objLoader = new OBJLoader();
    objLoader.setMaterials(materials);

    return promisifyLoad(objLoader)(objectUri);
  }

  addObject = (object) => {
    const mesh = object;
    this.mesh = mesh;
    this.camera.lookAt(this.mesh.position);

    this.camera.position.z = this.calculateCamPos(mesh);
    this.scene.add(this.mesh);

    this.pointLight.position.z = this.calculateCamPos(mesh);
  };

  load = ({objectUri, materialUri, textures}) => {
    let loadMaterialPromise = Promise.resolve(null);
    if (materialUri) {
      loadMaterialPromise = this.loadMaterial(materialUri, textures);
    }

    return loadMaterialPromise
      .then(materials => this.loadObject(objectUri, materials))
      .then(this.addObject);
  };

  handleCameraPositionChange = (x, y, z) => {
    this.camera.position.set(x, y, z);
  };

  /**
   * Fit to the screen
   * @param mesh
   * @returns {*}
   */
  calculateCamPos = (mesh) => {
    const box = new THREE.Box3().setFromObject(mesh);
    const height = box.getSize().y;

    return height + height / (2 * Math.tan(this.camera.fov * (Math.PI / 360)))
  };

  onLoadError = (...args) => {
    console.error(args);
  };

  handleUpload = (uris) => {
    this.load(uris)
      .then(() => this.animate())
      .catch(this.onLoadError);
  };

  componentDidMount() {
    this.init();
  }

  render() {
    return (
      <div>
        <MeshUpload onUpload={this.handleUpload}/>
        <Divider />
        <div
          className="Viewer"
          ref={(root) => {
            this.root = root;
          }}
        >
        </div>
        <CameraControls updateCameraPosition={this.handleCameraPositionChange}/>
      </div>
    );
  }
}

Viewer.propTypes = {};

export default Viewer;