import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import CircularProgress from 'material-ui/CircularProgress';
import LinearProgress from 'material-ui/LinearProgress';
import {List, ListItem} from 'material-ui/List';

import styles from './FilesList.css';

const calcTotalProgress = (progress, filesCount) => {
  return progress.reduce((total, p) => total + p, 0) / filesCount;
};

class FileItem extends PureComponent {
  render() {
    const {fileName, type, progress} = this.props;
    return (
      <ListItem
        primaryText={fileName}
        secondaryText={type}
        rightIcon={(
          <CircularProgress mode="determinate" value={progress}/>
        )}
      />
    );
  }
}

FileItem.propTypes = {
  fileName: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  progress: PropTypes.number.isRequired,
};

class FilesList extends PureComponent {
  render() {
    const {files, progress, filesCount, types} = this.props;

    return (
      <div className="FilesList">
        <LinearProgress mode="determinate" value={calcTotalProgress(progress, filesCount)} style={{width: '50%'}}/>
        <List>
          {files.map((file, i) => (
            <FileItem key={file} fileName={file} type={types[i]} progress={progress[i]}/>
          ))}
        </List>
      </div>
    );
  }
}

FilesList.propTypes = {
  files: PropTypes.arrayOf(PropTypes.string).isRequired,
  types: PropTypes.arrayOf(PropTypes.string).isRequired,
  progress: PropTypes.arrayOf(PropTypes.number).isRequired,
  filesCount: PropTypes.number,
};

export default FilesList;