// pages/breathing/breathing.js
const patterns = [
  {
    name: '4-7-8 呼吸法',
    phases: [
      { name: '吸气', duration: 4, from: 0.3, to: 1.0, color: [100,130,200] },
      { name: '屏息', duration: 7, from: 1.0, to: 1.0, color: [140,120,170] },
      { name: '呼气', duration: 8, from: 1.0, to: 0.3, color: [80,120,180] }
    ],
    restDuration: 2, restScale: 0.3
  },
  {
    name: '方块呼吸',
    phases: [
      { name: '吸气', duration: 4, from: 0.3, to: 1.0, color: [100,130,200] },
      { name: '屏息', duration: 4, from: 1.0, to: 1.0, color: [140,120,170] },
      { name: '呼气', duration: 4, from: 1.0, to: 0.3, color: [80,120,180] },
      { name: '屏息', duration: 4, from: 0.3, to: 0.3, color: [140,120,170] }
    ]
  },
  {
    name: '平静呼吸',
    phases: [
      { name: '吸气', duration: 4, from: 0.3, to: 1.0, color: [100,130,200] },
      { name: '呼气', duration: 6, from: 1.0, to: 0.3, color: [80,120,180] }
    ]
  }
]

Page({
  data: {
    patternIdx: 0,
    phaseIdx: 0,
    phaseTimer: 0,
    circleScale: 0.3,
    phaseName: '吸气',
    patternName: '4-7-8 呼吸法',
    pulseKey: 0,
    // 视觉参数
    circleSize: 80,
    ringMid: 100,
    ringOuter: 130,
    glowSize: 300,
    glowColor: 'rgba(100,130,200,0.08)',
    ringColor: 'rgba(100,130,200,0.65)',
    textColor: 'rgba(100,130,200,0.35)',
  },

  _timer: null,
  _startTime: 0,
  _phaseElapsed: 0,
  _startRest: false,
  _restTimer: 0,
  _inhaleAudio: null,
  _exhaleAudio: null,

  onLoad() {
    this._initAudio()
  },

  onShow() {
    this._startTime = Date.now()
    this._phaseElapsed = 0
    this._startRest = false
    this._restTimer = 0

    // 初始化阶段数据
    var pattern = this._getPattern()
    var phase = pattern.phases[0]
    var minR = 80, maxR = 220
    var scale = phase.from
    var circleSize = minR + (maxR - minR) * scale
    var col = phase.color
    var c = col[0] + ',' + col[1] + ',' + col[2]
    this.setData({
      circleSize: circleSize,
      ringMid: circleSize * 1.15,
      ringOuter: circleSize * 1.45,
      glowSize: circleSize * 2.8,
      glowColor: 'rgba(' + c + ',0.08)',
      colorOuter: 'rgba(' + c + ',0.1)',
      colorMid: 'rgba(' + c + ',0.2)',
      colorInner: 'rgba(' + c + ',0.6)',
      textColor: 'rgba(' + c + ',0.35)',
      phaseName: phase.name,
    })
    this._playPhaseAudio(phase.name)
    this._startLoop()
  },

  onHide() {
    this._stopLoop()
  },

  onUnload() {
    this._stopLoop()
    this._destroyAudio()
  },

  _initAudio() {
    this._inhaleAudio = wx.createInnerAudioContext()
    this._inhaleAudio.src = '/assets/audio/inhale.mp3'
    this._inhaleAudio.volume = 0.5
    this._inhaleAudio.obeyMuteSwitch = false
    this._inhaleAudio.onError(function() {})

    this._exhaleAudio = wx.createInnerAudioContext()
    this._exhaleAudio.src = '/assets/audio/exhale.mp3'
    this._exhaleAudio.volume = 0.5
    this._exhaleAudio.obeyMuteSwitch = false
    this._exhaleAudio.onError(function() {})
  },

  _destroyAudio() {
    if (this._inhaleAudio) { this._inhaleAudio.stop(); this._inhaleAudio.destroy() }
    if (this._exhaleAudio) { this._exhaleAudio.stop(); this._exhaleAudio.destroy() }
  },

  _playPhaseAudio(name) {
    if (this._inhaleAudio) this._inhaleAudio.stop()
    if (this._exhaleAudio) this._exhaleAudio.stop()
    if (name === '吸气') this._inhaleAudio.play()
    else if (name === '呼气') this._exhaleAudio.play()
  },

  _startLoop() {
    var self = this
    var lastTime = Date.now()
    function tick() {
      var now = Date.now()
      var dt = now - lastTime
      lastTime = now
      self._update(dt)
      self._timer = setTimeout(tick, 16)
    }
    this._timer = setTimeout(tick, 16)
  },

  _stopLoop() {
    if (this._timer) { clearTimeout(this._timer); this._timer = null }
  },

  _ease(t) {
    return 0.5 - 0.5 * Math.cos(Math.PI * t)
  },

  _getPattern() { return patterns[this.data.patternIdx] },

  _getPhase() {
    var p = this._getPattern()
    if (this._startRest) {
      return { name: '放松', duration: p.restDuration, from: p.restScale || 0.3, to: p.restScale || 0.3, color: [120,110,140] }
    }
    return p.phases[this.data.phaseIdx]
  },

  _update(dt) {
    var pattern = this._getPattern()
    var phase = this._getPhase()
    this._phaseElapsed += dt / 1000

    // 计算圆的大小
    var progress = Math.min(this._phaseElapsed / phase.duration, 1)
    var eased = this._ease(progress)
    var scale = phase.from + (phase.to - phase.from) * eased

    // 转换为像素
    var minR = 80
    var maxR = 220
    var circleSize = minR + (maxR - minR) * scale

    // 颜色（外层淡、中层中、内层亮）
    var col = phase.color
    var c = col[0] + ',' + col[1] + ',' + col[2]
    var glowColor = 'rgba(' + c + ',' + (0.06 + scale * 0.06) + ')'

    this.setData({
      circleSize: circleSize,
      ringMid: circleSize * 1.15,
      ringOuter: circleSize * 1.45,
      glowSize: circleSize * 2.8,
      glowColor: glowColor,
      colorOuter: 'rgba(' + c + ',0.1)',
      colorMid: 'rgba(' + c + ',0.2)',
      colorInner: 'rgba(' + c + ',0.6)',
      textColor: 'rgba(' + c + ',0.35)',
      phaseName: phase.name,
    })

    // 阶段切换 + 脉冲
    if (this._phaseElapsed >= phase.duration) {
      this._phaseElapsed = 0
      this.data.phaseIdx++
      this.setData({ pulseKey: this.data.pulseKey + 1 })

      if (this.data.phaseIdx >= pattern.phases.length) {
        if (pattern.restDuration) {
          this.data.phaseIdx = 0
          this._startRest = true
          this._restTimer = 0
          this._stopAllAudio()
        } else {
          this.data.phaseIdx = 0
        }
      }

      this._playPhaseAudio(this._getPhase().name)
    }

    // rest 阶段
    if (this._startRest) {
      this._restTimer += dt / 1000
      if (this._restTimer >= pattern.restDuration) {
        this._startRest = false
        this._restTimer = 0
        this.data.phaseIdx = 0
        this._phaseElapsed = 0
        this._playPhaseAudio(pattern.phases[0].name)
      }
    }
  },

  _stopAllAudio() {
    if (this._inhaleAudio) this._inhaleAudio.stop()
    if (this._exhaleAudio) this._exhaleAudio.stop()
  },

  switchPattern() {
    this.data.patternIdx = (this.data.patternIdx + 1) % patterns.length
    this.data.phaseIdx = 0
    this._phaseElapsed = 0
    this._startRest = false
    this._restTimer = 0
    this._stopAllAudio()
    this.setData({ patternName: patterns[this.data.patternIdx].name })
    this._playPhaseAudio(this._getPhase().name)
  },

  goBack() {
    this._stopAllAudio()
    wx.navigateBack()
  }
})
