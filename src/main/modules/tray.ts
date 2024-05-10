import { Tray, Menu, nativeImage } from 'electron'
import { isWin } from '@common/utils'
import path from 'node:path'
import {
  hideWindow as hideMainWindow,
  isExistWindow as isExistMainWindow,
  isShowWindow as isShowMainWindow,
  sendTaskbarButtonClick,
  showWindow as showMainWindow,
} from './winMain'
import { quitApp } from '@main/app'

let tray: Electron.Tray | null
let isEnableTray: boolean = false
let themeId: number

const playerState = {
  empty: false,
  collect: false,
  play: false,
  next: true,
  prev: true,
}

const watchConfigKeys = [
  'desktopLyric.enable',
  'desktopLyric.isLock',
  'desktopLyric.isAlwaysOnTop',
  'tray.themeId',
  'tray.enable',
  'common.langId',
] satisfies Array<keyof LX.AppSetting>

const themeList = [
  {
    id: 0,
    fileName: 'trayTemplate',
    isNative: true,
  },
  {
    id: 1,
    fileName: 'tray_origin',
    isNative: false,
  },
  {
    id: 2,
    fileName: 'tray_black',
    isNative: false,
  },
]

const messages = {
  'en-us': {
    collect: 'Collection',
    uncollect: 'Cancel collection',
    play: 'Play',
    pause: 'Pause',
    next: 'Next song',
    prev: 'Previous song',
    hide_win_main: 'Hide Main Window',
    show_win_main: 'Show Main Window',
    hide_win_lyric: 'Close desktop lyrics',
    show_win_lyric: 'Open desktop lyrics',
    lock_win_lyric: 'Lock desktop lyrics',
    unlock_win_lyric: 'Unlock desktop lyrics',
    top_win_lyric: 'Set top lyrics',
    untop_win_lyric: 'Cancel top lyrics',
    exit: 'Exit',
  },
  'zh-cn': {
    collect: '收藏',
    uncollect: '取消收藏',
    play: '播放',
    pause: '暂停',
    next: '下一曲',
    prev: '上一曲',
    hide_win_main: '隐藏主界面',
    show_win_main: '显示主界面',
    hide_win_lyric: '关闭桌面歌词',
    show_win_lyric: '开启桌面歌词',
    lock_win_lyric: '锁定桌面歌词',
    unlock_win_lyric: '解锁桌面歌词',
    top_win_lyric: '置顶歌词',
    untop_win_lyric: '取消置顶',
    exit: '退出',
  },
  'zh-tw': {
    collect: '收藏',
    uncollect: '取消收藏',
    play: '播放',
    pause: '暫停',
    next: '下一曲',
    prev: '上一曲',
    hide_win_main: '隱藏主界面',
    show_win_main: '顯示主界面',
    hide_win_lyric: '關閉桌面歌詞',
    show_win_lyric: '開啟桌面歌詞',
    lock_win_lyric: '鎖定桌面歌詞',
    unlock_win_lyric: '解鎖桌面歌詞',
    top_win_lyric: '置頂歌詞',
    untop_win_lyric: '取消置頂',
    exit: '退出',
  },
} as const
type Messages = typeof messages
type Langs = keyof Messages
const i18n = {
  message: messages['zh-cn'] as Messages[Langs],
  fallbackLocale: 'en-us' as 'en-us',
  getMessage(key: keyof Messages[Langs]) {
    return this.message[key]
  },
  setLang(lang?: Langs | null) {
    this.message = lang
      ? messages[lang] ?? messages[this.fallbackLocale]
      : messages[this.fallbackLocale]
  },
}

const getIconPath = (id: number) => {
  let theme = themeList.find(item => item.id === id) ?? themeList[0]
  return path.join(global.staticPath, 'images/tray', theme.fileName + (isWin ? '.ico' : '.png'))
}

export const createTray = () => {
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  if ((tray && !tray.isDestroyed()) || !global.lx.appSetting['tray.enable']) return

  // 托盘
  tray = new Tray(nativeImage.createFromPath(getIconPath(global.lx.appSetting['tray.themeId'])))

  tray.setToolTip('Fun音乐')
  createMenu()
  tray.setIgnoreDoubleClickEvents(true)
  tray.on('click', () => {
    showMainWindow()
  })
}

export const destroyTray = () => {
  if (!tray) return
  tray.destroy()
  isEnableTray = false
  tray = null
}

const handleUpdateConfig = (config: any) => {
  global.lx.event_app.update_config(config)
}

const createPlayerMenu = () => {
  let menu: Electron.MenuItemConstructorOptions[] = []
  menu.push(playerState.play ? {
    label: i18n.getMessage('pause'),
    click() {
      sendTaskbarButtonClick('pause')
    },
  } : {
    label: i18n.getMessage('play'),
    click() {
      sendTaskbarButtonClick('play')
    },
  })
  menu.push({
    label: i18n.getMessage('prev'),
    click() {
      sendTaskbarButtonClick('prev')
    },
  })
  menu.push({
    label: i18n.getMessage('next'),
    click() {
      sendTaskbarButtonClick('next')
    },
  })
  menu.push(playerState.collect ? {
    label: i18n.getMessage('uncollect'),
    click() {
      sendTaskbarButtonClick('unCollect')
    },
  } : {
    label: i18n.getMessage('collect'),
    click() {
      sendTaskbarButtonClick('collect')
    },
  })
  return menu
}

export const createMenu = () => {
  if (!tray) return
  let menu: Electron.MenuItemConstructorOptions[] = createPlayerMenu()
  if (playerState.empty) for (const m of menu) m.enabled = false
  menu.push({ type: 'separator' })
  menu.push(global.lx.appSetting['desktopLyric.enable']
    ? {
        label: i18n.getMessage('hide_win_lyric'),
        click() {
          handleUpdateConfig({ 'desktopLyric.enable': false })
        },
      }
    : {
        label: i18n.getMessage('show_win_lyric'),
        click() {
          handleUpdateConfig({ 'desktopLyric.enable': true })
        },
      })
  menu.push(global.lx.appSetting['desktopLyric.isLock']
    ? {
        label: i18n.getMessage('unlock_win_lyric'),
        click() {
          handleUpdateConfig({ 'desktopLyric.isLock': false })
        },
      }
    : {
        label: i18n.getMessage('lock_win_lyric'),
        click() {
          handleUpdateConfig({ 'desktopLyric.isLock': true })
        },
      })
  menu.push(global.lx.appSetting['desktopLyric.isAlwaysOnTop']
    ? {
        label: i18n.getMessage('untop_win_lyric'),
        click() {
          handleUpdateConfig({ 'desktopLyric.isAlwaysOnTop': false })
        },
      }
    : {
        label: i18n.getMessage('top_win_lyric'),
        click() {
          handleUpdateConfig({ 'desktopLyric.isAlwaysOnTop': true })
        },
      })
  menu.push({ type: 'separator' })
  if (isExistMainWindow()) {
    const isShow = isShowMainWindow()
    menu.push(isShow
      ? {
          label: i18n.getMessage('hide_win_main'),
          click() {
            hideMainWindow()
          },
        }
      : {
          label: i18n.getMessage('show_win_main'),
          click() {
            showMainWindow()
          },
        })
  }
  menu.push({
    label: i18n.getMessage('exit'),
    click() {
      quitApp()
    },
  })
  const contextMenu = Menu.buildFromTemplate(menu)
  tray.setContextMenu(contextMenu)
}

export const setTrayImage = (themeId: number) => {
  if (!tray) return
  tray.setImage(nativeImage.createFromPath(getIconPath(themeId)))
}

const init = () => {
  if (themeId != global.lx.appSetting['tray.themeId']) {
    themeId = global.lx.appSetting['tray.themeId']
    setTrayImage(themeId)
  }
  if (isEnableTray !== global.lx.appSetting['tray.enable']) {
    isEnableTray = global.lx.appSetting['tray.enable']
    global.lx.appSetting['tray.enable'] ? createTray() : destroyTray()
  }
  createMenu()
}

export default () => {
  global.lx.event_app.on('updated_config', (keys, setting) => {
    if (!watchConfigKeys.some(key => keys.includes(key))) return

    if (keys.includes('common.langId')) i18n.setLang(setting['common.langId'])

    init()
  })

  global.lx.event_app.on('main_window_ready_to_show', () => {
    createMenu()
  })
  global.lx.event_app.on('main_window_show', () => {
    createMenu()
  })
  if (!isWin) {
    global.lx.event_app.on('main_window_focus', () => {
      createMenu()
    })
    global.lx.event_app.on('main_window_blur', () => {
      createMenu()
    })
  }
  global.lx.event_app.on('main_window_hide', () => {
    createMenu()
  })
  global.lx.event_app.on('main_window_close', () => {
    destroyTray()
  })

  global.lx.event_app.on('app_inited', () => {
    i18n.setLang(global.lx.appSetting['common.langId'])
    init()
  })

  global.lx.event_app.on('player_status', (status) => {
    let updated = false
    if (status.status) {
      switch (status.status) {
        case 'paused':
          playerState.play = false
          playerState.empty &&= false
          break
        case 'error':
          playerState.play = false
          playerState.empty &&= false
          break
        case 'playing':
          playerState.play = true
          playerState.empty &&= false
          break
        case 'stoped':
          playerState.play &&= false
          playerState.empty = true
          break
      }
      updated = true
    }
    if (status.collect != null) {
      playerState.collect = status.collect
      updated = true
    }
    if (updated) init()
  })
}
