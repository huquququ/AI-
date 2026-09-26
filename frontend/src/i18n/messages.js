const messages = {
  'zh-CN': {
    app: {
      title: '\u89d2\u8272\u5bf9\u8bdd',
      navHome: '\u9996\u9875',
      navRoles: '\u89d2\u8272\u914d\u7f6e',
      navHistory: '\u5386\u53f2\u8bb0\u5f55',
      navMenu: '\u83dc\u5355',
      footer: '\u89d2\u8272\u626e\u6f14 AI \u5bf9\u8bdd\u5e73\u53f0'
    },
    home: {
      heroTitle: '星漫语',
      heroSubtitle: '\u4e0e\u559c\u6b22\u7684\u865a\u62df\u89d2\u8272\u8fdb\u884c\u6c89\u6d78\u5f0f\u5bf9\u8bdd\u3002',
      heroFeatureOne: '\u67d4\u548c\u6c89\u6d78\u7684\u5bf9\u8bdd\u6c1b\u56f4',
      heroFeatureTwo: '\u7acb\u7ed8\u4e0e\u4eba\u8bbe\u5206\u79bb\u67e5\u770b',
      heroFeatureThree: '\u8f7b\u91cf\u5f00\u542f\uff0c\u65e0\u538b\u529b\u966a\u4f34',
      chooseRole: '\u9009\u62e9\u89d2\u8272',
      createRole: '\u521b\u5efa\u89d2\u8272',
      loadingRoles: '\u6b63\u5728\u52a0\u8f7d\u89d2\u8272...',
      emptyIcon: '\ud83c\udfad',
      emptyTitle: '\u8fd8\u6ca1\u6709\u89d2\u8272',
      emptyDescription: '\u5148\u521b\u5efa\u4e00\u4e2a\u89d2\u8272\uff0c\u518d\u5f00\u59cb\u5bf9\u8bdd\u3002',
      noDescription: '\u6682\u65e0\u63cf\u8ff0',
      viewDetails: '\u67e5\u770b\u8be6\u60c5',
      detailsTitle: '\u89d2\u8272\u8be6\u60c5',
      closeDetails: '\u5173\u95ed',
      startChat: '\u5f00\u59cb\u5bf9\u8bdd',
      edit: '\u7f16\u8f91',
      delete: '\u5220\u9664',
      deleteConfirm: '\u786e\u5b9a\u8981\u5220\u9664\u89d2\u8272\u201c{roleName}\u201d\u5417\uff1f\u6b64\u64cd\u4f5c\u4e0d\u53ef\u6062\u590d\u3002',
      deleteSuccess: '\u89d2\u8272\u5220\u9664\u6210\u529f\u3002',
      deleteFailed: '\u5220\u9664\u89d2\u8272\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5\u3002'
    },
    roleConfig: {
      editTitle: '\u7f16\u8f91\u89d2\u8272',
      createTitle: '\u521b\u5efa\u89d2\u8272',
      back: '\u8fd4\u56de',
      roleName: '\u89d2\u8272\u540d\u79f0',
      roleNamePlaceholder: '\u8bf7\u8f93\u5165\u89d2\u8272\u540d\u79f0',
      roleDescription: '\u89d2\u8272\u63cf\u8ff0',
      roleDescriptionPlaceholder: '\u8bf7\u63cf\u8ff0\u89d2\u8272\u7684\u6027\u683c\u548c\u80cc\u666f',
      avatarUrl: '\u5934\u50cf\u94fe\u63a5',
      avatarPlaceholder: '\u8bf7\u8f93\u5165\u5934\u50cf\u94fe\u63a5\uff0c\u6216\u4f7f\u7528\u4e0b\u65b9\u4e0a\u4f20\u529f\u80fd',
      avatarHelp: '\u70b9\u51fb\u6216\u62d6\u62fd\u56fe\u7247\u5230\u4e0b\u65b9\u533a\u57df\uff0c\u4ec5\u652f\u6301\u56fe\u7247\uff0c\u6700\u5927 5MB\u3002',
      uploadAvatar: '\u4e0a\u4f20\u5934\u50cf',
      uploadHint: '\u70b9\u51fb\u9009\u62e9\u56fe\u7247\uff0c\u6216\u5c06\u56fe\u7247\u62d6\u62fd\u5230\u8fd9\u91cc',
      remove: '\u79fb\u9664',
      cancel: '\u53d6\u6d88',
      saving: '\u4fdd\u5b58\u4e2d...',
      updateRole: '\u66f4\u65b0\u89d2\u8272',
      createRole: '\u521b\u5efa\u89d2\u8272',
      noFile: '\u672a\u9009\u62e9\u6587\u4ef6\u3002',
      imageOnly: '\u53ea\u80fd\u4e0a\u4f20\u56fe\u7247\u6587\u4ef6\u3002',
      maxSize: '\u56fe\u7247\u5927\u5c0f\u4e0d\u80fd\u8d85\u8fc7 5MB\u3002',
      missingUrl: '\u4e0a\u4f20\u6210\u529f\uff0c\u4f46\u670d\u52a1\u7aef\u6ca1\u6709\u8fd4\u56de\u56fe\u7247\u5730\u5740\u3002',
      uploadFailed: '\u4e0a\u4f20\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5\u3002',
      updateSuccess: '\u89d2\u8272\u66f4\u65b0\u6210\u529f\u3002',
      createSuccess: '\u89d2\u8272\u521b\u5efa\u6210\u529f\u3002',
      saveFailed: '\u4fdd\u5b58\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5\u3002'
    },
    history: {
      title: '\u5386\u53f2\u8bb0\u5f55',
      backHome: '\u8fd4\u56de\u9996\u9875',
      loading: '\u6b63\u5728\u52a0\u8f7d\u5386\u53f2\u8bb0\u5f55...',
      emptyIcon: '\ud83d\udcdd',
      emptyTitle: '\u6682\u65e0\u5386\u53f2\u8bb0\u5f55',
      emptyDescription: '\u5f00\u59cb\u4e0e\u89d2\u8272\u5bf9\u8bdd\u540e\uff0c\u5386\u53f2\u8bb0\u5f55\u4f1a\u663e\u793a\u5728\u8fd9\u91cc\u3002',
      startChat: '\u5f00\u59cb\u5bf9\u8bdd',
      firstChat: '\u9996\u6b21\u5bf9\u8bdd\uff1a',
      latestChat: '\u6700\u8fd1\u5bf9\u8bdd\uff1a',
      messages: '\u6d88\u606f\u6570\u91cf\uff1a',
      continue: '\u7ee7\u7eed\u5bf9\u8bdd',
      delete: '\u5220\u9664\u8bb0\u5f55',
      deleteConfirm: '\u786e\u5b9a\u8981\u5220\u9664\u8fd9\u6761\u5386\u53f2\u8bb0\u5f55\u5417\uff1f',
      fetchFailed: '\u83b7\u53d6\u5386\u53f2\u8bb0\u5f55\u5931\u8d25\uff1a',
      deleteFailed: '\u5220\u9664\u5386\u53f2\u8bb0\u5f55\u5931\u8d25\uff1a',
      justNow: '\u521a\u521a',
      minutesAgo: '{count} \u5206\u949f\u524d',
      hoursAgo: '{count} \u5c0f\u65f6\u524d',
      daysAgo: '{count} \u5929\u524d'
    },
    chat: {
      back: '\u8fd4\u56de',
      defaultTitle: '\u804a\u5929',
      online: '\u5728\u7ebf',
      connecting: '\u8fde\u63a5\u4e2d...',
      clear: '\u6e05\u7a7a',
      settings: '\u8bbe\u7f6e',
      loadingMessages: '\u6b63\u5728\u52a0\u8f7d\u6d88\u606f...',
      emptyIcon: '\u804a\u5929',
      emptyTitle: '\u5f00\u59cb\u4e00\u6bb5\u5bf9\u8bdd',
      emptyDescription: '\u7ed9 {roleName} \u53d1\u9001\u7b2c\u4e00\u6761\u6d88\u606f\u5427\u3002',
      sending: '\u53d1\u9001\u4e2d...',
      failed: '\u5931\u8d25',
      inputPlaceholder: '\u8f93\u5165\u6d88\u606f...',
      image: '\u56fe\u7247',
      send: '\u53d1\u9001',
      uploadMessageMissing: '\u4e0a\u4f20\u6210\u529f\uff0c\u4f46\u6d88\u606f\u8bb0\u5f55\u672a\u521b\u5efa\u3002',
      uploadFailed: '\u4e0a\u4f20\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5\u3002',
      clearConfirm: '\u786e\u5b9a\u8981\u6e05\u7a7a\u5f53\u524d\u5bf9\u8bdd\u5417\uff1f',
      settingsTodo: '\u8bbe\u7f6e\u9762\u677f\u6682\u672a\u5b9e\u73b0\u3002'
    },
    message: {
      aiFailed: 'AI \u54cd\u5e94\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5\u3002'
    }
  }
}

const defaultLocale = 'zh-CN'

const getByPath = (target, path) => {
  return path.split('.').reduce((current, key) => current?.[key], target)
}

export const t = (path, params = {}, locale = defaultLocale) => {
  const template = getByPath(messages[locale], path)
  if (typeof template !== 'string') {
    return path
  }

  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return key in params ? String(params[key]) : `{${key}}`
  })
}

export const currentLocale = defaultLocale
