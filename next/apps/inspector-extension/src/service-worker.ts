interface ZenInspectorTab {
  readonly id?: number;
  readonly url?: string;
}

interface ZenInspectorToggleResponse {
  readonly active?: boolean;
}

interface ZenInspectorChromeApi {
  readonly action: {
    readonly onClicked: {
      addListener(listener: (tab: ZenInspectorTab) => void): void;
    };
    setBadgeText(details: Readonly<{ tabId: number; text: string }>): Promise<void>;
    setTitle(details: Readonly<{ tabId: number; title: string }>): Promise<void>;
  };
  readonly scripting: {
    executeScript(
      details: Readonly<{
        target: Readonly<{ tabId: number }>;
        files: readonly string[];
      }>
    ): Promise<readonly unknown[]>;
  };
  readonly tabs: {
    sendMessage(
      tabId: number,
      message: Readonly<{ type: 'zen-inspector:toggle' }>
    ): Promise<ZenInspectorToggleResponse>;
  };
}

declare const chrome: ZenInspectorChromeApi;

const TOGGLE_MESSAGE = Object.freeze({ type: 'zen-inspector:toggle' } as const);
const CONTENT_FILES = Object.freeze(['diagnostics.js', 'content.js'] as const);

function scriptableUrl(url: string | undefined): boolean {
  if (!url) return true;
  try {
    const protocol = new URL(url).protocol;
    return protocol === 'http:' || protocol === 'https:' || protocol === 'file:';
  } catch {
    return false;
  }
}

async function updateBadge(tabId: number, active: boolean): Promise<void> {
  await Promise.all([
    chrome.action.setBadgeText({ tabId, text: active ? 'ON' : '' }),
    chrome.action.setTitle({
      tabId,
      title: active ? 'Desactivar Zen Inspector' : 'Activar Zen Inspector'
    })
  ]);
}

async function markUnavailable(tabId: number): Promise<void> {
  await Promise.all([
    chrome.action.setBadgeText({ tabId, text: '!' }),
    chrome.action.setTitle({
      tabId,
      title: 'Zen Inspector no puede ejecutarse en esta página protegida por el navegador'
    })
  ]);
}

async function toggleInspector(tab: ZenInspectorTab): Promise<void> {
  const tabId = tab.id;
  if (tabId === undefined) return;
  if (!scriptableUrl(tab.url)) {
    await markUnavailable(tabId);
    return;
  }

  try {
    const response = await chrome.tabs.sendMessage(tabId, TOGGLE_MESSAGE);
    await updateBadge(tabId, response.active === true);
    return;
  } catch {
    // No content runtime is installed in this navigation yet.
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: CONTENT_FILES
    });
    await updateBadge(tabId, true);
  } catch {
    await markUnavailable(tabId);
  }
}

chrome.action.onClicked.addListener((tab) => {
  void toggleInspector(tab);
});

export {};
