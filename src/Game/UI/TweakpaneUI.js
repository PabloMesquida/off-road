export default class TweakpaneUI {
  constructor({
    pane,
    placing,
    transformManager,
    onToggleEditMode, // function(boolean)
    onSaveAssets      // function()
  }) {
    this.pane = pane
    this.placing = placing
    this.transformManager = transformManager
    this.onToggleEditMode = onToggleEditMode
    this.onSaveAssets = onSaveAssets

    // Guarda referencias a controles para posible dispose
    this._controls = {}

    this._create()
  }

  _create() {
    if (!this.pane) return

    try {
      this.assetsfolder = this.pane.addFolder({ title: 'Assets', expanded: false })
      this.signsFolder = this.assetsfolder.addFolder({ title: 'Signs', expanded: false })
      this.editParam = { editMode: false }

      // binding toggle
      const binding = this.pane.addBinding(this.editParam, 'editMode', { label: 'EDIT MODE' })
      this._controls.binding = binding
      // store handler so it can be cleaned later
      this._controls.onBindingChange = ev => this.onToggleEditMode?.(ev.value)
      binding.on('change', this._controls.onBindingChange)

      const makePlaceBtn = (folder, title, type) => {
        const btn = folder.addButton({ title })
        const handler = () => {
          this.placing?.togglePlacing(type)
          this.transformManager?.detach()
        }
        btn.on('click', handler)
        return { btn, handler }
      }

      this._controls.placingButtons = []

      this._controls.placingButtons.push(makePlaceBtn(this.assetsfolder, 'Cone', 'cone'))
      this._controls.placingButtons.push(makePlaceBtn(this.assetsfolder, 'Barrel', 'barrel'))
      this._controls.placingButtons.push(makePlaceBtn(this.assetsfolder, 'Ramp', 'ramp'))
      this._controls.placingButtons.push(makePlaceBtn(this.assetsfolder, 'Speed Bump', 'bump'))
      this._controls.placingButtons.push(makePlaceBtn(this.assetsfolder, 'Concrete Barrier', 'barrier'))
      this._controls.placingButtons.push(makePlaceBtn(this.assetsfolder, 'Tire', 'tire'))

      // signs
      this._controls.placingButtons.push(makePlaceBtn(this.signsFolder, 'Sign Ahead', 'signAhead'))
      this._controls.placingButtons.push(makePlaceBtn(this.signsFolder, 'Sign Stop', 'signStop'))
      this._controls.placingButtons.push(makePlaceBtn(this.signsFolder, 'Sign Warning', 'signWarning'))
      this._controls.placingButtons.push(makePlaceBtn(this.signsFolder, 'Sign Do Not Enter', 'signNot'))

      // save button
      this._controls.save = {}
      const saveBtn = this.assetsfolder.addButton({ title: 'Save Assets' })
      this._controls.save.handler = () => {
        this.onSaveAssets?.()
      }
      saveBtn.on('click', this._controls.save.handler)
      this._controls.save.btn = saveBtn

      // initialize visual state
      this.updateState(false)
    } catch (e) {
      // Si tweakpane no está presente, guardamos el warning y seguimos
      // No lanzamos errores para no romper la inicialización
      console.warn('[TweakpaneUI] Tweakpane no disponible:', e)
    }
  }

  updateState(isEditing) {
    // Responsable de cambiar la apariencia/interactividad del folder
    try {
      const el = this.assetsfolder?.element
      if (el) {
        el.style.opacity = isEditing ? '1' : '0.5'
        el.style.pointerEvents = isEditing ? 'auto' : 'none'
      }
      // Actualizar binding visual si existe
      if (this.editParam) this.editParam.editMode = !!isEditing
      // Si hack necesario para que binding refresque, podríamos reemitir
    } catch (e) {
      // silencioso
    }
  }

  // Permite reasignar referencias si cambian (opcional)
  setPlacing(placing) {
    this.placing = placing
  }

  setTransformManager(tm) {
    this.transformManager = tm
  }

  dispose() {
    // Intentamos limpiar handlers. Dependiendo de la versión de tweakpane
    // las API de off() pueden diferir; hacemos lo básico.
    try {
      if (this._controls?.binding && this._controls.onBindingChange) {
        this._controls.binding.off?.('change', this._controls.onBindingChange)
      }

      if (this._controls?.placingButtons) {
        for (const item of this._controls.placingButtons) {
          item.btn?.off?.('click', item.handler)
        }
      }

      if (this._controls?.save?.btn && this._controls?.save?.handler) {
        this._controls.save.btn?.off?.('click', this._controls.save.handler)
      }

      // No intentamos remover los folders del pane para evitar romper otras cosas.
    } catch (e) {
      // no fatal
    }
  }
}
