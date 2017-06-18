import React, {Component} from "react";
import PropTypes from "prop-types";
import RaisedButton from "material-ui/RaisedButton";
import FilesList from "../FilesList/FilesList";
import mime from "mime-types";
import path from "path";

const promisify = func => (...args) => new Promise((resolve, reject) => func(...args, resolve, reject));
const promisifyProgress = func => (arg, progress) => new Promise((resolve) => func(arg, resolve, progress));

const findFiles = (entries) => {
  const files = {
    object: null,
    material: null,
    textures: [],
  };

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    if (entry.directory) {
      continue;
    }

    const fileName = path.basename(entry.filename);
    const isHidden = fileName[0] === '.' || fileName.slice(0, 2) === '__';
    if (isHidden) {
      continue;
    }

    const extension = fileName.slice(-3).toLowerCase();

    switch (extension) {
      case 'obj':
        files.object = entry;
        break;
      case 'mtl':
        files.material = entry;
        break;
      case 'png':
      case 'jpg':
      case 'bmp':
      case 'tif':
      case 'tga':
        files.textures.push(entry);
        break;
      default:
        const type = mime.lookup(extension);
        if (type && type.slice(0, 5) === 'image') {
          files.textures.push(entry);
        }
    }
  }

  return files;
};

function getArcLength(fraction, props) {
  return fraction * Math.PI * (props.size - props.thickness);
}

class MeshUpload extends Component {
  state = {
    files: null,
    types: null,
    filesCount: 0,
    error: '',
    loading: false,
  };

  handleError = (error) => {
    this.setState(error);
  };

  unzipBlob = (zipFile) => {
    const zip = window.zip;
    let zipReader;

    return promisify(zip.createReader)(new zip.BlobReader(zipFile))
      .then((_zipReader) => {
        zipReader = _zipReader;
        return promisify(zipReader.getEntries.bind(zipReader))();
      })
      .then((entries) => {
        const {object, material, textures} = findFiles(entries);

        if (!object) {
          throw new Error('Mesh file in .OBJ format is not found!');
        }

        this.setState({
          files: [object.filename, material && material.filename, ...textures.map(texture => texture.filename)],
          types: ['Object', 'Material', ...textures.map(() => 'Texture')]
        });

        // +!!var will be 0 if the var is empty and 1 if it isn't
        const filesCount = +!!object + +!!material + textures.length;

        this.setState({filesCount});

        let totalProgress = 0;

        const onProgress = (index) => {
          return (current, total) => {
            // React goes crazy when I want to show progress
            // this.setState({progress});
            const value = current / total;
            totalProgress += value / filesCount;
            this.updateProgress(index, value, totalProgress);
          }
        };

        const loadTextures = () => {
          return textures.map((texture, i) =>
            promisifyProgress(texture.getData.bind(texture))(new zip.BlobWriter(mime.contentType(texture.filename.slice(-3))), onProgress(2 + i))
              .then(data => ({name: texture.filename, data})),
          );
        };

        return Promise.all([
          promisifyProgress(object.getData.bind(object))(new zip.BlobWriter('text/plain'), onProgress(0)),
          material ? promisifyProgress(material.getData.bind(material))(new zip.BlobWriter('text/plain'), onProgress(1)) : null,
          ...loadTextures(),
        ]);
      })
      .then(([object, material, ...textures]) => {
        zipReader.close();
        return {object, material, textures};
      })
      .catch(this.handleError);
  };

  createObjectURI(blob) {
    if (!blob) return null;
    return URL.createObjectURL(blob);
  };

  deleteObjectURI(uri) {
    if (!uri) return;

    URL.revokeObjectURL(uri);
  };

  handleChange = (event) => {
    this.setState({
      error: ''
    });

    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const ext = file.name.slice(-3).toLowerCase();

    let promise;

    if (ext === 'zip') {
      return this.unzipBlob(file)
        .then(({object, material, textures}) => {
          const uris = {
            objectUri: this.createObjectURI(object),
            materialUri: this.createObjectURI(material),
            textures: textures.map(texture => ({uri: this.createObjectURI(texture.data), name: texture.name})),
          };

          uris.cleanup = () => {
            this.deleteObjectURI(uris.objectUri);
            this.deleteObjectURI(uris.materialUri);
            uris.texture.forEach(uri => this.deleteObjectURI(uri));
          };


          this.props.onUpload(uris);
        });
    } else if (ext === 'obj') {
      this.setState({
        files: [file.name],
        types: ['Object'],
      });

      return this.props.onUpload({objectUri: this.createObjectURI(file)});
    }

    this.setState({
      error: 'You should provide either .OBJ file or .ZIP archive with .OBJ file in it'
    });
  };

  // Because we need to call this function a lot, we are going to change the progress
  // directly rather than calling setState
  updateProgress = (index, value, total) => {
    const el = this.progressRefs[index];
    const props = el.props;
    el.refs.path.style.strokeDasharray = `${getArcLength(value, props)}, ${getArcLength(1, props)}`;

    const totalEl = this.totalProgressRef;
    totalEl.refs.bar1.parentElement.style.width = `${total * 100}%`;
  };

  loadExample = () => {
    this.setState({loading: true});
    return fetch('viktor.zip')
      .then(res => res.arrayBuffer())
      .then((buffer) => {
        const blob = new Blob([buffer], {type: 'application/octet-stream'});
        return this.unzipBlob(blob);
      })
      .then(({object, material, textures}) => {
        const uris = {
          objectUri: this.createObjectURI(object),
          materialUri: this.createObjectURI(material),
          textures: textures.map(texture => ({uri: this.createObjectURI(texture.data), name: texture.name})),
        };

        this.props.onUpload(uris);
      })
      .then(() => {
        this.setState({loading: false});
      })
      .catch(() => {
        this.setState({loading: false});
      })
  };

  render() {
    const {files, types, filesCount, error, loading} = this.state;

    this.progressRefs = Array.from({length: filesCount});

    return (
      <div className="MeshUpload">
        <RaisedButton
          label={loading ? 'Summoning...' : 'Summon Viktor'}
          onClick={this.loadExample}
          disabled={loading}
        />
        <span style={{margin: '0 5px'}}>or</span>
        <RaisedButton
          containerElement="label"
          primary
          label="Load Mesh"
        >
          <input type="file" style={{display: 'none'}} onChange={this.handleChange}/>
        </RaisedButton>
        {!files && <p>
          Provide .OBJ file or ZIP archive with .OBJ file or/and its materials and textures
        </p>}
        {error && <p style={{color: 'red'}}>
          {error}
        </p>}
        {files && <FilesList
          files={files}
          types={types}
          progressRef={(progress, index) => {
            this.progressRefs[index] = progress;
          }}
          totalProgressRef={progress => {
            this.totalProgressRef = progress;
          }}
        />}
      </div>
    );
  }
}

MeshUpload.propTypes = {
  onUpload: PropTypes.func.isRequired,
};

export default MeshUpload;