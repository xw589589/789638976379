<template>
  <material-modal :show="!isAgreePact || isShowPact" max-width="70%" :bg-close="isAgreePact" :close-btn="isAgreePact" @close="handleClose(false)">
    <main :class="$style.main">
      <h2>警告</h2>
      <div class="select scroll" :class="$style.content">
        <p>这不是官方版本的Fun音乐，请注意</p><br>
        <p><strong>九、接受协议</strong></p>
        <p>9.1&nbsp;若你使用了本项目，将代表你接受本协议。</p><br>
        <p><strong>*</strong>&nbsp;若协议更新，恕不另行通知，可到开源地址查看。</p>
        <p v-if="!isAgreePact"><strong>若你（使用者）接受以上协议，请点击下面的“接受”按钮签署本协议，若不接受，请点击“不接受”后退出软件并清除本软件的所有数据。</strong></p>
      </div>
      <div v-if="!isAgreePact" :class="$style.btns">
        <base-btn :class="$style.btn" @click="handleClose(true)">{{ $t('not_agree') }}</base-btn>
        <base-btn :class="$style.btn" :disabled="!btnEnable" @click="handleClick">{{ $t('agree') }} {{ timeStr }}</base-btn>
      </div>
    </main>
  </material-modal>
</template>

<script>
import { checkUpdate, quitApp } from '@renderer/utils/ipc'
import { openUrl } from '@common/utils/electron'
import { isShowPact } from '@renderer/store'
import { appSetting, saveAgreePact } from '@renderer/store/setting'
import { computed } from '@common/utils/vueTools'

export default {
  setup() {
    const isAgreePact = computed(() => appSetting['common.isAgreePact'])

    return {
      isShowPact,
      isAgreePact,
      appSetting,
    }
  },
  data() {
    return {
      time: 1,
    }
  },
  computed: {
    btnEnable() {
      return this.time == 0
    },
    timeStr() {
      return this.btnEnable ? '' : `(${this.time})`
    },
  },
  watch: {
    isAgreePact(n) {
      if (n) return
      this.time = 1
      this.startTimeout()
    },
  },
  mounted() {
    this.$nextTick(() => {
      if (!this.isAgreePact) {
        this.startTimeout()
      }
    })
  },
  methods: {
    handleClick() {
      saveAgreePact(true)
      window.setTimeout(() => {
        this.$dialog({
          message: Buffer.from('e69cace8bdafe4bbb6e5ae8ce585a8e5858de8b4b9e4b894e5bc80e6ba90efbc8ce5a682e69e9ce4bda0e698afe88ab1e992b1e8b4ade4b9b0e79a84efbc8ce8afb7e79bb4e68ea5e7bb99e5b7aee8af84efbc810a0a5468697320736f667477617265206973206672656520616e64206f70656e20736f757263652e', 'hex').toString(),
          confirmButtonText: Buffer.from('e5a5bde79a8420284f4b29', 'hex').toString(),
        }).then(() => {
          checkUpdate()
        })
      }, 2e3)
    },
    handleClose(isExit) {
      if (isExit) { quitApp(true); return }
      isShowPact.value = false
    },
    openUrl(url) {
      void openUrl(url)
    },
    startTimeout() {
      window.setTimeout(() => {
        if (--this.time > 0) this.startTimeout()
      }, 1e3)
    },
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.main {
  padding: 15px 8px 12px;
  min-width: 200px;
  min-height: 0;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  h2 {
    font-size: 16px;
    color: var(--color-font);
    line-height: 1.3;
    text-align: center;
  }
}

.content {
  flex: auto;
  margin: 15px 0;
  padding: 0 7px;
  h3 {
    font-weight: bold;
    line-height: 2;
  }
  p {
    line-height: 1.5;
    font-size: 14px;
    text-align: justify;
  }
}

.btns {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.btn {
  display: block;
  width: 48%;
  &:last-child {
    margin-bottom: 0;
  }
}


</style>
