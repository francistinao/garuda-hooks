import { useState, useRef, useCallback, RefObject } from 'react';

/**
 * 
 * Observe the inner html where dthis was used
 */

interface UseClipboardReturn {
    ref: RefObject<HTMLElement | null>;
    copied: boolean;
    copy: () => Promise<boolean>
}

export function useClipboard(): UseClipboardReturn {
    const isSSR = !window || typeof window === 'undefined';
    const targetRef = useRef<HTMLElement | null>(null)
    const [isCopied, setIsCopied] = useState<boolean>(false)

    const copyToClipboard = useCallback(async () => {
        if(isSSR) return false;
        // check the element of the targetRef where it was referenced at
        const element = targetRef.current

        //check if element is null
        if(!element) return false;

        try {
            const value = element?.innerText ?? element?.textContent ?? ''

            if(typeof navigator === 'undefined' || !navigator?.clipboard?.writeText) return false

            // copy the text to the clipboard
            await navigator.clipboard.writeText(value);
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 3000) // schedule to setIsCopied to false back
            return true;
        } catch (error) {
            console.error("Error copying text on clipboard", error);
            setIsCopied(false)
            return false;
        }
    }, [isSSR])
    
    return {
        ref: targetRef,
        copied: isCopied,
        copy: copyToClipboard,
    }
}