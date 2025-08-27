import { invoke } from "@tauri-apps/api/core";
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { useCallback, useState, useEffect } from "react";

export function useSettingsWindow() {
    const [isOpened, setIsOpened] = useState(false);

    const openSettingsWindow = useCallback(async () => {
        try {
            await invoke('open_settings_window');
            setIsOpened(true);
        } catch (error) {
            console.error('Error opening settings window:', error);
        }
    }, []);

    const closeSettingsWindow = useCallback(async () => {
        try {
            const window = await WebviewWindow.getByLabel('settings');
            window?.close();
            setIsOpened(false);
        } catch (error) {
            console.error('Error closing settings window:', error);
        }
    }, []);

    useEffect(() => {
        if (!isOpened) return;
        (async () => {
            const window = await WebviewWindow.getByLabel('settings');
            if (!window) return;
            await window.once('tauri://close-requested', () => {
                window.close();
                setIsOpened(false);
            });
        })();
    }, [isOpened]);

    return { open: openSettingsWindow, close: closeSettingsWindow, isOpened };
}
