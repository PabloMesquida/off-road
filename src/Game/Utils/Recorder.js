export default class Recorder {
  constructor(domElement, buttonSelector) {
    this.domElement = domElement
    this.recordBtn = document.querySelector(buttonSelector)

    this.recording = false
    this.mediaRecorder = null
    this.recordedChunks = []

    this.initButton()
  }

  initButton() {
    this.recordBtn.addEventListener('click', () => {
      if (!this.recording) {
        this.startRecording()
        this.recordBtn.textContent = "🛑 Detener"
      } else {
        this.stopRecording()
        this.recordBtn.textContent = "🎬 Grabar"
      }
      this.recording = !this.recording
    })
  }

  startRecording() {
    const stream = this.domElement.captureStream(60)
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 12000000
    })

    this.recordedChunks = []

    this.mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) this.recordedChunks.push(e.data)
    }

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = 'threejs_recording.webm'
      a.click()

      URL.revokeObjectURL(url)
    }

    this.mediaRecorder.start()
    console.log("🎥 Grabación iniciada...")
  }

  stopRecording() {
    if (this.mediaRecorder && this.recording) {
      this.mediaRecorder.stop()
      console.log("🛑 Grabación detenida.")
    }
  }
}
