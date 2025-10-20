/** last changed: 2025.1.9 */

Shuang.app.action = {
  init() {
    /** Update Resources **/
    if (navigator && navigator.userAgent && /windows|linux/i.test(navigator.userAgent)) {
      Shuang.resource.emoji = { right: '✔️', wrong: '❌' }
    }

    /** Rendering **/
    function renderSelect(target, options, callback) {
      options.forEach(option => {
        const opt = document.createElement('option')
        if (option.disabled) opt.setAttribute('disabled', 'disabled')
        opt.innerText = option.text || option
        target.appendChild(opt)
      })
      target.onchange = e => {
        callback(e.target.value)
      }
    }

    const schemeList = Object.values(Shuang.resource.schemeList)
    const schemes = {
      common: schemeList.filter(scheme => !scheme.endsWith('*')),
      uncommon: schemeList
        .filter(scheme => scheme.endsWith('*') && !scheme.endsWith('**'))
        .map(scheme => scheme.slice(0, -1))
      ,
      rare: schemeList
        .filter(scheme => scheme.endsWith('**'))
        .map(scheme => scheme.slice(0, -2))
    }
    const schemeOptions = [
      { disabled: true, text: '常见' },
      ...schemes.common,
      { disabled: true, text: '小众' },
      ...schemes.uncommon,
      { disabled: true, text: '爱好者' },
      ...schemes.rare,
    ]
    renderSelect($('#scheme-select'), schemeOptions, value => {
      Shuang.app.setting.setScheme(value)
    })
    renderSelect($('#mode-select'), Object.values(Shuang.app.modeList).map(mode => mode.name), value => {
      Shuang.app.setting.setMode(value)
      this.next()
    })
    const keyboardLayoutOptions = Object.values(Shuang.resource.keyboardLayoutList)
    renderSelect($('#keyboard-layout-select'), keyboardLayoutOptions, (value) => {
      Shuang.app.setting.setKeyboardLayout(value)
    })

    /** Setting First Question **/
    Shuang.core.current = new Shuang.core.model('sh', 'uang')

    /** Reset Configs **/
    Shuang.app.setting.reload()

    /** Listen Events **/
    document.addEventListener('keydown', e => {
      // 如果焦点在输入框上，不阻止默认行为
      if (e.target.tagName === 'INPUT' && (e.target.id === 'question-count' || e.target.id === 'time-limit')) {
        return
      }
      
      if (['Backspace', 'Tab', 'Enter', ' '].includes(e.key)) {
        if (e.preventDefault) {
          e.preventDefault()
        } else {
          event.returnValue = false
        }
      }
    })
    document.addEventListener('keyup', e => {
      // 如果焦点在输入框上，不处理全局快捷键
      if (e.target.tagName === 'INPUT' && (e.target.id === 'question-count' || e.target.id === 'time-limit')) {
        return
      }
      
      this.keyPressed(e)
    })
    $('#pic-switcher').addEventListener('change', e => {
      Shuang.app.setting.setPicVisible(e.target.checked)
    })
    $('#show-keys').addEventListener('change', e => {
      Shuang.app.setting.setShowKeys(e.target.checked)
    })
    $('#dark-mode-switcher').addEventListener('change', e => {
      Shuang.app.setting.setDarkMode(e.target.checked)
    })
    $('#more-settings-switcher').addEventListener('click', e => {
      Shuang.app.action.toggleMoreSettingsVisible()
    })
    $('#auto-next-switcher').addEventListener('change', e => {
      Shuang.app.setting.setAutoNext(e.target.checked)
    })
    $('#auto-clear-switcher').addEventListener('change', e => {
      Shuang.app.setting.setAutoClear(e.target.checked)
    })
    $('#show-pressed-key').addEventListener('change', e => {
      Shuang.app.setting.setShowPressedKey(e.target.checked)
    })
    $('#disable-mobile-keyboard').addEventListener('change', e => {
      Shuang.app.setting.setDisableMobileKeyboard(e.target.checked)
    })
    $('#bopomofo-switcher').addEventListener('change', e => {
      Shuang.app.setting.setBopomofo(e.target.checked)
    })
    
    // 限时练习相关事件监听器
    $('#toggle-timed-practice').addEventListener('click', e => {
      this.toggleTimedPractice()
    })
    $('#start-timed-practice').addEventListener('click', e => {
      this.startTimedPractice()
    })
    $('#stop-timed-practice').addEventListener('click', e => {
      this.stopTimedPractice()
    })
    $('#dict').addEventListener('click', () => {
      Shuang.core.current.beforeJudge()
      $('#a').value = Shuang.core.current.scheme.values().next().value
      this.judge()
    })
    window.addEventListener('resize', Shuang.app.setting.updateKeysHintLayoutRatio)
    window.resizeTo(window.outerWidth, window.outerHeight)

    /** Simulate Keyboard */
    const keys = $$('.key')
    for (let i = 0; i < keys.length; i++) {
      // IE 不支持实例化 KeyboardEvent
      if (navigator && navigator.userAgent && /msie|trident/i.test(navigator.userAgent))
        break
      keys[i].addEventListener('click', (e) => {
        const key = e.target.getAttribute('key')
        if (!key) return
        const event = new KeyboardEvent('keyup', { key: key.toLowerCase() })
        event.simulated = true
        document.dispatchEvent(event)
      })
    }

    /** All Done **/
    Shuang.app.setting.updateQAndDict()
    this.redo()
  },
  keyPressed(e) {
    switch (e.key) {
      case 'Backspace':
        this.redo()
        break
      case 'Tab':
        Shuang.core.current.beforeJudge()
        $('#a').value = Shuang.core.current.scheme.values().next().value
        this.judge()
        break
      case 'Enter':
      case ' ':
        if (this.judge()) {
          this.next()
        } else {
          this.redo()
        }
        break
      default:
        if (e.simulated) {
          $('#a').value += e.key.toLowerCase()
        }
        $('#a').value = $('#a').value
          .slice(0, 2)
          .replace(/[^a-zA-Z;]/g, '')
          .split('')
          .map((c, i) => i === 0 ? c.toUpperCase() : c.toLowerCase())
          .join('')
        Shuang.app.setting.updatePressedKeyHint(e.key)
        const canAuto = $('#a').value.length === 2
        const isRight = this.judge()
        if (canAuto) {
          if (isRight && Shuang.app.setting.config.autoNext === 'true') {
            this.next(e.simulated)
          } else if (!isRight && Shuang.app.setting.config.autoClear === 'true') {
            this.redo(e.simulated)
          }
        }
    }
  },
  redo(noFocus) {
    $('#a').value = ''
    if (!noFocus) $('#a').focus()
    $('#btn').onclick = () => this.redo(noFocus)
    $('#btn').innerText = Shuang.resource.emoji.wrong
  },
  toggleMoreSettingsVisible() {
    $('#more-settings').style.display = $('#more-settings').style.display === 'block' ? 'none' : 'block'
    $('#more-settings-switcher') .innerText = $('#more-settings').style.display === 'block' ? '收起更多' : '展开更多'
  },
  
  // 限时练习相关方法
  toggleTimedPractice() {
    const panel = $('#timed-practice-panel')
    const toggle = $('#toggle-timed-practice')
    
    if (panel.style.display === 'none' || panel.style.display === '') {
      panel.style.display = 'block'
      toggle.classList.add('active')
      toggle.innerText = '关闭限时练习'
    } else {
      if (Shuang.app.timedPractice.isActive) {
        this.stopTimedPractice()
      }
      panel.style.display = 'none'
      toggle.classList.remove('active')
      toggle.innerText = '限时练习'
    }
  },
  
  startTimedPractice() {
    const questionCount = parseInt($('#question-count').value) || 10
    const timeLimit = parseInt($('#time-limit').value) || 60
    
    if (questionCount < 1 || questionCount > 100) {
      alert('题目数量必须在1-100之间')
      return
    }
    
    if (timeLimit < 10 || timeLimit > 600) {
      alert('时间限制必须在10-600秒之间')
      return
    }
    
    // 初始化限时练习状态
    Shuang.app.timedPractice.isActive = true
    Shuang.app.timedPractice.totalQuestions = questionCount
    Shuang.app.timedPractice.completedQuestions = 0
    Shuang.app.timedPractice.correctAnswers = 0
    Shuang.app.timedPractice.timeRemaining = timeLimit
    Shuang.app.timedPractice.startTime = Date.now()
    
    // 更新UI
    $('#timed-practice-panel').style.display = 'none'
    $('#timed-practice-status').style.display = 'block'
    $('#start-timed-practice').style.display = 'none'
    $('#stop-timed-practice').style.display = 'inline-block'
    $('#toggle-timed-practice').disabled = true
    
    // 更新状态显示
    this.updateTimedPracticeStatus()
    
    // 开始计时器
    this.startTimedPracticeTimer()
    
    // 开始第一题
    this.next()
  },
  
  stopTimedPractice() {
    if (Shuang.app.timedPractice.timer) {
      clearInterval(Shuang.app.timedPractice.timer)
      Shuang.app.timedPractice.timer = null
    }
    
    Shuang.app.timedPractice.isActive = false
    
    // 更新UI
    $('#timed-practice-panel').style.display = 'block'
    $('#timed-practice-status').style.display = 'none'
    $('#start-timed-practice').style.display = 'inline-block'
    $('#stop-timed-practice').style.display = 'none'
    $('#toggle-timed-practice').disabled = false
    
    // 重置输入框
    this.redo()
  },
  
  startTimedPracticeTimer() {
    Shuang.app.timedPractice.timer = setInterval(() => {
      Shuang.app.timedPractice.timeRemaining--
      this.updateTimedPracticeStatus()
      
      if (Shuang.app.timedPractice.timeRemaining <= 0) {
        this.endTimedPractice(false) // 时间到，失败
      }
    }, 1000)
  },
  
  updateTimedPracticeStatus() {
    const minutes = Math.floor(Shuang.app.timedPractice.timeRemaining / 60)
    const seconds = Shuang.app.timedPractice.timeRemaining % 60
    $('#time-remaining').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    
    $('#completed-count').textContent = Shuang.app.timedPractice.completedQuestions
    $('#total-count').textContent = Shuang.app.timedPractice.totalQuestions
    
    const accuracy = Shuang.app.timedPractice.completedQuestions > 0 
      ? Math.round((Shuang.app.timedPractice.correctAnswers / Shuang.app.timedPractice.completedQuestions) * 100)
      : 0
    $('#accuracy').textContent = `${accuracy}%`
  },
  
  endTimedPractice(success) {
    this.stopTimedPractice()
    
    const isSuccess = success || Shuang.app.timedPractice.completedQuestions >= Shuang.app.timedPractice.totalQuestions
    const accuracy = Shuang.app.timedPractice.completedQuestions > 0 
      ? Math.round((Shuang.app.timedPractice.correctAnswers / Shuang.app.timedPractice.completedQuestions) * 100)
      : 0
    
    this.showTimedPracticeResult(isSuccess, accuracy)
  },
  
  showTimedPracticeResult(success, accuracy) {
    // 创建结果弹窗
    const resultDiv = document.createElement('div')
    resultDiv.className = `timed-practice-result ${success ? 'success' : 'failure'}`
    
    const title = success ? '🎉 练习完成！' : '⏰ 时间到！'
    const message = success ? '恭喜你完成了所有题目！' : '时间到了，练习结束。'
    
    resultDiv.innerHTML = `
      <h3>${title}</h3>
      <div class="result-stats">
        <div>完成题目：<span>${Shuang.app.timedPractice.completedQuestions}</span> / <span>${Shuang.app.timedPractice.totalQuestions}</span></div>
        <div>正确率：<span>${accuracy}%</span></div>
        <div>用时：<span>${Math.round((Date.now() - Shuang.app.timedPractice.startTime) / 1000)}</span> 秒</div>
      </div>
      <button onclick="this.parentElement.remove()">关闭</button>
      <button onclick="this.parentElement.remove(); Shuang.app.action.startTimedPractice()">再来一次</button>
    `
    
    document.body.appendChild(resultDiv)
  },
  
  // 重写next方法以支持限时练习
  next(noFocus) {
    this.redo(noFocus)
    
    // 如果是限时练习模式，检查是否完成
    if (Shuang.app.timedPractice.isActive) {
      Shuang.app.timedPractice.completedQuestions++
      if (Shuang.app.timedPractice.completedQuestions >= Shuang.app.timedPractice.totalQuestions) {
        this.endTimedPractice(true) // 完成所有题目，成功
        return
      }
    }
    
    // 原有的next逻辑
    switch (Shuang.app.setting.config.mode) {
      case 'all-random':
        Shuang.core.current = Shuang.core.model.getRandom()
        break
      case 'all-order':
        Shuang.core.current = Shuang.core.model.getByOrder()
        break
      case 'hard-random':
        Shuang.core.current = Shuang.core.model.getHardRandom()
        break
      case 'hard-random-without-pinyin':
        do {
          Shuang.core.current = Shuang.core.model.getHardRandom()
        } while (Array.isArray(Shuang.core.current.dict))
        break
    }
    if (Shuang.core.history.includes(Shuang.core.current.sheng + Shuang.core.current.yun)) this.next()
    else Shuang.core.history = [...Shuang.core.history, Shuang.core.current.sheng + Shuang.core.current.yun].slice(-100)

    // Update Keys Hint
    Shuang.app.setting.updateQAndDict()
    Shuang.core.current.beforeJudge()
    Shuang.app.setting.updateKeysHint()
  },
  
  // 重写judge方法以支持限时练习
  judge() {
    const input = $('#a')
    const btn = $('#btn')
    const [sheng, yun] = input.value
    if (yun && Shuang.core.current.judge(sheng, yun)) {
      btn.onclick = () => this.next(true)
      btn.innerText = Shuang.resource.emoji.right
      
      // 如果是限时练习模式，记录正确答案
      if (Shuang.app.timedPractice.isActive) {
        Shuang.app.timedPractice.correctAnswers++
      }
      
      return true
    } else {
      btn.onclick = () => this.redo(true)
      btn.innerText = Shuang.resource.emoji.wrong
      return false
    }
  }
}
