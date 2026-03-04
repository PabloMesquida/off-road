import { Pane } from 'tweakpane'

class DebugUI {
  constructor({ title = 'Edit Panel' } = {}) {
    this.pane = new Pane({ title })
  }

  addFolder(options) {
    return this.pane.addFolder(options)
  }

  addBinding(target, key, options) {
    return this.pane.addBinding(target, key, options)
  }

  addButton(options) {
    return this.pane.addButton(options)
  }

  setFolderEnabled(folder, enabled) {
    if (!folder?.element) return
    folder.element.style.opacity = enabled ? '1' : '0.5'
    folder.element.style.pointerEvents = enabled ? 'auto' : 'none'
  }

  dispose() {
    this.pane.dispose()
  }
}

export default DebugUI
