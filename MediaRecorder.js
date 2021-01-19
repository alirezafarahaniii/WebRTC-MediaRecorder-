function download() {  //function for getting recorded file
  console.log('navig')
  const link = document.createElement('a')
  link.href = recording
  link.download = 'example.webm'  //name of recorded file
  document.body.appendChild(link)
  link.click()
  link.parentNode.removeChild(link)
}

let chunks = []
let stream, desktopStream, voiceStream, mediaRecorder, recording

async function startCapture(element) { //this function statrs recoring
  try {
    console.log('navig')
    chunks = []
    recording = null
    desktopStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions)
    voiceStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
    // console.dir(desktopStream)
    // console.dir(voiceStream)
    desktopStream.addEventListener('inactive', e => {
      console.log('Capture stream inactive - stop recording!')
      stopCapture(element)
    })
    const audioTracks = mergeAudioStreams(desktopStream, voiceStream)
    console.log(audioTracks)

    const tracks = [...desktopStream.getVideoTracks(), ...audioTracks]
    stream = new MediaStream(tracks)

    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9,opus' })
    mediaRecorder.addEventListener('dataavailable', event => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data)
        // console.dir(chunks)
      }
    })
    mediaRecorder.start(10)

    console.log('end navig')
    // dumpOptionsInfo()
  } catch (err) {
    console.error('Error: ' + err)
  }
}

// Options for getDisplayMedia()
var displayMediaOptions = {
  video: {
    cursor: 'always',
    displaySurface: 'browser'
  },
  videoConstraints: {
    mandatory: {
      chromeMediaSource: 'tab'
    }
  },
  audio: {
    echoCancellation: false,
    noiseSuppression: false, //if set it true your own voice won't record
    sampleRate: 44100
  }
}

const mergeAudioStreams = (desktopStream, voiceStream) => {  // merging desktop voice and microphone voice
  const context = new AudioContext()
  // Create a couple of sources
  const source1 = context.createMediaStreamSource(desktopStream)
  const source2 = context.createMediaStreamSource(voiceStream)
  const destination = context.createMediaStreamDestination()
  const desktopGain = context.createGain()
  const voiceGain = context.createGain()
  desktopGain.gain.value = 0.7
  voiceGain.gain.value = 0.7
  source1.connect(desktopGain).connect(destination)
  // Connect source2
  source2.connect(voiceGain).connect(destination)
  return destination.stream.getAudioTracks()
}

function stopCapture(element) { //stop recording
  console.log('stopCapture')

  if (mediaRecorder && stream) {
    mediaRecorder.stop()
    mediaRecorder = null

    stream.getTracks().forEach(track => track.stop())
    stream = null
    desktopStream = null
    voiceStream = null

    recording = window.URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }))

    download()
  }
}
