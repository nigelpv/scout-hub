import { useRegisterSW } from 'virtual:pwa-register/react'
import { toast } from "sonner"
import { useEffect } from 'react'

export function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r)
        },
        onRegisterError(error) {
            console.log('SW registration error', error)
        },
    })

    useEffect(() => {
        if (offlineReady) {
            toast.success("App ready to work offline")
            setOfflineReady(false)
        }
    }, [offlineReady, setOfflineReady])

    useEffect(() => {
        if (needRefresh) {
            toast.info("New content available, click to reload", {
                action: {
                    label: "Reload",
                    onClick: () => updateServiceWorker(true)
                },
                duration: Infinity,
                // Prevent auto-dismissal so user sees it
            })
        }
    }, [needRefresh, updateServiceWorker])

    return null
}
