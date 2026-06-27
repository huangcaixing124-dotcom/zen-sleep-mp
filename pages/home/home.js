// pages/home/home.js
Page({
  data: {},

  goBreathing() {
    wx.navigateTo({ url: '/pages/breathing/breathing' })
  },

  goZen() {
    wx.navigateTo({ url: '/pages/zen/zen' })
  }
})
