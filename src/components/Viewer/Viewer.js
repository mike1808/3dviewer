import React, {Component} from "react";
import Divider from "material-ui/Divider";

import * as THREE from "three";
import MTLLoader from "../../three/MTLLoader";
import OBJLoader from "../../three/OBJLoader";

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
  state = {
    minZ: 0,
    maxZ: 10,
    cameraPosition: new THREE.Vector3(0, 0, 2),
  };

  componentDidMount() {
    this.init();
  }

  componentWillUpdate(nextProps, nextState) {
    const {cameraPosition} = nextState;
    console.log(cameraPosition);
    this.camera.position.copy(cameraPosition);
    this.pointLight.position.copy(cameraPosition);
  }

  init = () => {
    const {width, height} = this.getRendererSize();

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.001, 1000);
    this.camera.position.copy(this.state.cameraPosition);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(width, height);

    this.ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(this.ambientLight);

    this.pointLight = new THREE.PointLight(0xffffff, 0.8); // this should dependant on the mesh size
    this.pointLight.position.set(0, 0, 0);
    this.scene.add(this.pointLight);

    this.root.appendChild(this.renderer.domElement);

    window.addEventListener('resize', this.handleResize);
  };

  renderScene = () => {
    this.renderer.render(this.scene, this.camera);
  };

  animate = () => {
    requestAnimationFrame(this.animate);

    this.object.rotation.y += 0.01;

    this.renderScene();
  };

  handleResize = () => {
    const {width, height} = this.getRendererSize();
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

    mtlLoader.setMaterialOptions({texturePathMap, side: THREE.DoubleSide});

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
    if (this.object) {
      this.scene.remove(this.object);
    }

    const mesh = object.children[0];
    mesh.material.side = THREE.DoubleSide;

    this.object = object;
    this.scene.add(this.object);

    const {position, up, maxZ, minZ} = this.calculateCameraPosition(this.object);
    this.pointLight.up.copy(up);
    this.camera.up.copy(up);

    this.setState({
      cameraPosition: position,
      minZ,
      maxZ,
    });

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

  handleCameraZChange = (z) => {
    this.setState(state => ({cameraPosition: new THREE.Vector3(state.cameraPosition.x, state.cameraPosition.y, z)}));
  };

  /**
   * Fit to the screen
   * @param mesh
   * @returns {*}
   */
  calculateCameraPosition = (mesh) => {
    const box = new THREE.Box3().setFromObject(mesh);
    const height = box.getSize().y;
    const centroid = this.calculateMeshCentroid(mesh);

    const position = new THREE.Vector3().copy(centroid);

    const zValue = height + height / (2 * Math.tan(this.camera.fov * (Math.PI / 360)))
    position.z = zValue;

    const v1 = centroid.clone().sub(position).normalize();
    const v2 = centroid.clone();
    const up = new THREE.Vector3().crossVectors(v1, v2).normalize();

    return {
      position,
      up,
      minZ: box.min.z,
      maxZ: 10 * zValue,
    };
  };

  calculateMeshCentroid = (mesh) => {
    const box = new THREE.Box3().setFromObject(mesh);
    const centroid = new THREE.Vector3().addVectors(box.min, box.max).divideScalar(2);
    return centroid;
  };

  onLoadError = (...args) => {
    console.error(args);
  };

  handleUpload = (uris) => {
    this.load(uris)
      .then(() => this.animate())
      .catch(this.onLoadError);
  };

  render() {
    const {cameraPosition, minZ, maxZ} = this.state;

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
        <CameraControls
          zValue={cameraPosition.z}
          minZ={minZ}
          maxZ={maxZ}
          onCameraZChange={this.handleCameraZChange}
        />
      </div>
    );
  }
}

Viewer.propTypes = {};

export default Viewer;