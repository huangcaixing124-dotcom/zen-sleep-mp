// pages/zen/zen.js
Page({
  data: {
    mode: 'muyu',
    count: 0,
    striking: false,
    imgSize: 450,
    ripples: [],       // 涟漪列表
    strikeParticles: [], // 敲击粒子
    pulseKey: 0,
    pulseDur: 2000,
    _rippleId: 0,
    _dotId: 0,
  },

  _muyuAudio: null,
  _bowlAudio: null,
  _strikeTimer: null,

  onLoad() {
    try {
      var info = wx.getSystemInfoSync()
      this.setData({ imgSize: Math.min(info.windowWidth, info.windowHeight) * 0.55 })
    } catch(e) {
      this.setData({ imgSize: 280 })
    }

    // 音频池：每种声音创建 3 个 context，支持叠加
    this._muyuPool = []
    this._bowlPool = []
    this._muyuIdx = 0
    this._bowlIdx = 0
    for (var i = 0; i < 3; i++) {
      var m = wx.createInnerAudioContext()
      m.src = '/assets/audio/muyu.mp3'
      m.volume = 0.6
      m.obeyMuteSwitch = false
      m.onError(function() {})
      this._muyuPool.push(m)

      var b = wx.createInnerAudioContext()
      b.src = '/assets/audio/bowl.mp3'
      b.volume = 0.15
      b.obeyMuteSwitch = false
      b.onError(function() {})
      this._bowlPool.push(b)
    }
  },

  onUnload() {
    this._muyuPool.forEach(function(a) { a.stop(); a.destroy() })
    this._bowlPool.forEach(function(a) { a.stop(); a.destroy() })
    if (this._strikeTimer) clearTimeout(this._strikeTimer)
  },

  onStrike(e) {
    var self = this
    var isBowl = this.data.mode === 'bowl'
    var rippleDur = isBowl ? 6000 : 3000
    var pulseDur = isBowl ? 3000 : 1500

    // 获取触摸位置
    var tx = e.detail ? e.detail.x : this.renderer.W / 2
    var ty = e.detail ? e.detail.y : this.renderer.H / 2

    wx.vibrateShort({ type: 'light' })

    // 播放音效（从池中取下一个 context，支持叠加）
    if (isBowl) {
      var bIdx = this._bowlIdx % 3
      this._bowlIdx++
      var bCtx = this._bowlPool[bIdx]
      bCtx.stop()
      bCtx.play()
    } else {
      var mIdx = this._muyuIdx % 3
      this._muyuIdx++
      var mCtx = this._muyuPool[mIdx]
      mCtx.stop()
      mCtx.play()
    }

    // 敲击图片动画（缓慢渐变，配合音频时长）
    this.setData({ striking: true, count: this.data.count + 1 })
    if (this._strikeTimer) clearTimeout(this._strikeTimer)
    this._strikeTimer = setTimeout(function() {
      self.setData({ striking: false })
    }, isBowl ? 3000 : 2000)

    // 背景脉冲
    this.setData({ pulseKey: this.data.pulseKey + 1, pulseDur: pulseDur })

    // 在触摸位置生成涟漪（5层，每层延迟）
    var newRipples = []
    var baseId = this.data._rippleId
    for (var i = 0; i < 5; i++) {
      newRipples.push({
        id: baseId + i,
        x: tx,
        y: ty,
        dur: rippleDur,
        delay: i * rippleDur * 0.12,
      })
    }

    // 追加到涟漪列表
    var all = this.data.ripples.concat(newRipples)
    this.setData({
      ripples: all,
      _rippleId: baseId + 5,
    })

    // 敲击粒子：从触摸位置向外飞散 6-8 颗
    var dotCount = 6 + Math.floor(Math.random() * 3)
    var newDots = []
    for (var d = 0; d < dotCount; d++) {
      var angle = (Math.PI * 2 * d) / dotCount + (Math.random() - 0.5) * 0.5
      var dist = 40 + Math.random() * 60
      newDots.push({
        id: self.data._dotId + d,
        x: tx,
        y: ty,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        dur: 800 + Math.random() * 400,
        alpha: 0.5 + Math.random() * 0.3,
      })
    }
    self.setData({
      strikeParticles: self.data.strikeParticles.concat(newDots),
      _dotId: self.data._dotId + dotCount,
    })

    // 清理旧涟漪和粒子
    setTimeout(function() {
      self.setData({
        ripples: self.data.ripples.filter(function(r) { return r.id >= baseId - 10 }),
        strikeParticles: self.data.strikeParticles.filter(function(p) { return p.id >= self.data._dotId - 20 }),
      })
    }, rippleDur + 500)
  },

  switchMode() {
    wx.vibrateShort({ type: 'light' })
    var newMode = this.data.mode === 'muyu' ? 'bowl' : 'muyu'
    this.setData({ mode: newMode, count: 0, ripples: [] })
    // 停止所有正在播放的音频
    this._bowlPool.forEach(function(a) { a.stop() })
  },

  goBack() {
    this._muyuPool.forEach(function(a) { a.stop() })
    this._bowlPool.forEach(function(a) { a.stop() })
    wx.navigateBack()
  }
})
