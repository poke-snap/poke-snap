import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,

} from 'react-native';
import { withNavigationFocus } from 'react-navigation';
import { Camera, Constants, FileSystem, Permissions, WebBrowser, ImagePicker } from 'expo';
import {
  Ionicons,
  MaterialIcons,
  Foundation,
  MaterialCommunityIcons,
  Octicons
} from '@expo/vector-icons';

const landmarkSize = 2;

const flashModeOrder = {
  off: 'on',
  on: 'auto',
  auto: 'torch',
  torch: 'off',
};

const flashIcons = {
  off: 'flash-off',
  on: 'flash-on',
  auto: 'flash-auto',
  torch: 'highlight'
};

const wbOrder = {
  auto: 'sunny',
  sunny: 'cloudy',
  cloudy: 'shadow',
  shadow: 'fluorescent',
  fluorescent: 'incandescent',
  incandescent: 'auto',
};

const wbIcons = {
  auto: 'wb-auto',
  sunny: 'wb-sunny',
  cloudy: 'wb-cloudy',
  shadow: 'beach-access',
  fluorescent: 'wb-iridescent',
  incandescent: 'wb-incandescent',
};
class CameraScreen extends React.Component {
  state = {
    flash: 'off',
    zoom: 0,
    autoFocus: 'on',
    type: 'back',
    whiteBalance: 'auto',
    ratio: '16:9',
    ratios: [],
    barcodeScanning: false,
    faceDetecting: false,
    faces: [],
    newPhotos: false,
    permissionsGranted: false,
    pictureSize: undefined,
    pictureSizes: [],
    pictureSizeId: 0,
    showGallery: false,
    showMoreOptions: false,
    focusedScreen: true,
  };

  async componentDidMount() {
    // Get permissions for camera
    const { status: cameraStatus } = await Permissions.askAsync(Permissions.CAMERA);
    const { status: cameraRollStatus } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    this.setState({ permissionGranted: cameraStatus === 'granted' && cameraRollStatus === 'granted' });

    // Create Photos Directory
    _ = await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'photos/')
    .catch(e => {
      console.log(e, 'Directory exists');
    });

    const { navigation } = this.props;
    navigation.addListener('willFocus', () =>
      this.setState({ focusedScreen: true })
    );
    navigation.addListener('willBlur', () =>
      this.setState({ focusedScreen: false })
    );
  }

  static navigationOptions = {
    header: null,
  };


  onPictureSaved = async photo => {
    console.log('[Function Call] Saving Picture');
    
    _ = await FileSystem.moveAsync({
      from: photo.uri,
      to: FileSystem.documentDirectory + 'photos/face.jpg',
    });
    this.setState({ newPhotos: true });
  }

  sendPicture = async () => {
    console.log('[Function Call] Sending Picture');
    var formData = new FormData();
    // console.log(`${FileSystem.documentDirectory}photos/face.jpg`);
    // console.log(FileSystem.readDirectoryAsync(`${FileSystem.documentDirectory}photos/`));
    // let x = await FileSystem.readAsStringAsync(`${FileSystem.documentDirectory}photos/face.jpg`);
    // console.log(x);
    // console.log(FileSystem.readDirectoryAsync(`${FileSystem.documentDirectory}photos/`));
    // const blob = await new Promise((resolve, reject) => {
    //   const xhr = new XMLHttpRequest();
    //   xhr.onload = function() {
    //     resolve(xhr.response);
    //   };
    //   xhr.onerror = function() {
    //     reject(new TypeError('Network request failed'));
    //   };
    //   xhr.responseType = 'blob';
    //   xhr.open('POST', 'http://ec2-34-209-142-12.us-west-2.compute.amazonaws.com/', true);
    //   xhr.send();
    // });

    let photo = await FileSystem.readAsStringAsync(`${FileSystem.documentDirectory}photos/face.jpg`)
    formData.append('file', {
      photo,
    });

    // console.log('hi');
    // console.log(formData);

    // var xhr = new XMLHttpRequest();
    // xhr.open('POST', 'http://ec2-34-209-142-12.us-west-2.compute.amazonaws.com/');
    // xhr.send(formData);
    // console.log(xhr.response);

    let response = await fetch('http://ec2-34-209-142-12.us-west-2.compute.amazonaws.com/', {
      method: 'POST',
      body: formData,
      header: {
        Accept: 'application/json',
        'content-type': 'multipart/form-data',
      },
    })
    .then(response => response.json())
    .then(response => console.log('Success:', JSON.stringify(response)))
    .catch(error => console.error('Error:', error));
    console.log(response);
    return response;
  }

  takePicture = async () => {
    const {
      status: cameraPerm
    } = await Permissions.askAsync(Permissions.CAMERA);

    const {
      status: cameraRollPerm
    } = await Permissions.askAsync(Permissions.CAMERA_ROLL);

    // only if user allows permission to camera AND camera roll
    if (cameraPerm === 'granted' && cameraRollPerm === 'granted') {
      let pickerResult = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
      });

      this._handleImagePicked(pickerResult);
    }
  };

  toggleFaceDetection = () => this.setState({ faceDetecting: !this.state.faceDetecting });

  toggleFacing = () => this.setState({ type: this.state.type === 'back' ? 'front' : 'back' });

  toggleFlash = () => this.setState({ flash: flashModeOrder[this.state.flash] });

  toggleFocus = () => this.setState({ autoFocus: this.state.autoFocus === 'on' ? 'off' : 'on' });

  toggleView = () => this.setState({ showGallery: !this.state.showGallery, newPhotos: false });

  renderTopBar = () => {
    return (
      <View
        style={styles.topBar}>
        <TouchableOpacity style={styles.toggleButton} onPress={this.toggleFacing}>
          <Ionicons name="ios-reverse-camera" size={32} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toggleButton} onPress={this.toggleFlash}>
          <MaterialIcons name={flashIcons[this.state.flash]} size={32} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toggleButton} onPress={this.toggleWB}>
          <MaterialIcons name={wbIcons[this.state.whiteBalance]} size={32} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toggleButton} onPress={this.toggleFocus}>
          <Text style={[styles.autoFocusLabel, { color: this.state.autoFocus === 'on' ? "white" : "#6b6b6b" }]}>AF</Text>
        </TouchableOpacity>
      </View>
    );
  }

  renderBottomBar = () => {
    return (
      <View
        style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomButton} onPress={this.toggleMoreOptions}>
          <Octicons name="kebab-horizontal" size={30} color="white" />
        </TouchableOpacity>
        {/* Take Picture Button */}
        <View style={{ flex: 0.4 }}>
          <TouchableOpacity style={{ alignSelf: 'center' }} onPress={this.takePicture}>
            <Ionicons name="ios-radio-button-on" size={70} color="white" />
          </TouchableOpacity>
        </View>
        {/* Send Picture Button */}
        <TouchableOpacity style={styles.bottomButton} onPress={this.sendPicture}>
          <View>
            <Foundation name="thumbnails" size={30} color="white" />
            {this.state.newPhotos && <View style={styles.newPhotosDot} />}
          </View>
        </TouchableOpacity>
      </View>
    );
  }


  render() {
    // console.log('Rendering Camera');
    const { permissionGranted } = this.state;

    // Camera 
    if (permissionGranted === null) {
      return <View><Text>Camera permission is awaiting response</Text></View>;
    }
    else if (!permissionGranted) {
      return <Text>No access to camera</Text>;
    }
    else if (this.state.focusedScreen) {
      return (
        <View style={{ flex: 1 }}>
          <Camera
            ref={ref => {
              this.camera = ref;
            }}
            style={styles.camera}
            onCameraReady={this.collectPictureSizes}
            type={this.state.type}
            flashMode={this.state.flash}
            autoFocus={this.state.autoFocus}
            zoom={this.state.zoom}
            whiteBalance={this.state.whiteBalance}
            ratio={this.state.ratio}
            pictureSize={this.state.pictureSize}
            onMountError={this.handleMountError}
            onFacesDetected={this.state.faceDetecting ? this.onFacesDetected : undefined}
            onFaceDetectionError={this.onFaceDetectionError}
          >
            {this.renderTopBar()}
            {this.renderBottomBar()}
          </Camera>
        </View>
      );
    }
    else {
      return <View><Text>Camera is not focused</Text></View>
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flex: 0.2,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Constants.statusBarHeight / 2,
  },
  bottomBar: {
    paddingBottom: 5,
    backgroundColor: 'transparent',
    alignSelf: 'flex-end',
    justifyContent: 'space-between',
    flex: 0.12,
    flexDirection: 'row',
  },
  noPermissions: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  gallery: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  toggleButton: {
    flex: 0.25,
    height: 40,
    marginHorizontal: 2,
    marginBottom: 10,
    marginTop: 20,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoFocusLabel: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  bottomButton: {
    flex: 0.3,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newPhotosDot: {
    position: 'absolute',
    top: 0,
    right: -5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4630EB'
  },
  options: {
    position: 'absolute',
    bottom: 80,
    left: 30,
    width: 200,
    height: 160,
    backgroundColor: '#000000BA',
    borderRadius: 4,
    padding: 10,
  },
  detectors: {
    flex: 0.5,
    justifyContent: 'space-around',
    alignItems: 'center',
    flexDirection: 'row',
  },
  pictureQualityLabel: {
    fontSize: 10,
    marginVertical: 3,
    color: 'white'
  },
  pictureSizeContainer: {
    flex: 0.5,
    alignItems: 'center',
    paddingTop: 10,
  },
  pictureSizeChooser: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row'
  },
  pictureSizeLabel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  facesContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    top: 0,
  },
  face: {
    padding: 10,
    borderWidth: 2,
    borderRadius: 2,
    position: 'absolute',
    borderColor: '#FFD700',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  landmark: {
    width: landmarkSize,
    height: landmarkSize,
    position: 'absolute',
    backgroundColor: 'red',
  },
  faceText: {
    color: '#FFD700',
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 10,
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
  },
});

async function uploadImageAsync(uri) {
  let apiUrl = 'http://ec2-34-209-142-12.us-west-2.compute.amazonaws.com/';

  // Note:
  // Uncomment this if you want to experiment with local server
  //
  // if (Constants.isDevice) {
  //   apiUrl = `https://your-ngrok-subdomain.ngrok.io/upload`;
  // } else {
  //   apiUrl = `http://localhost:3000/upload`
  // }

  let uriParts = uri.split('.');
  let fileType = uriParts[uriParts.length - 1];

  let formData = new FormData();
  formData.append('photo', {
    uri,
    name: `photo.${fileType}`,
    type: `image/${fileType}`,
  });

  let options = {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'multipart/form-data',
    },
  };

  return fetch(apiUrl, options);
}

export default withNavigationFocus(CameraScreen);
