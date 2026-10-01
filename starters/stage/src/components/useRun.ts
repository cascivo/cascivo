import { useToast } from '@cascivo/react'
import { t } from '@cascivo/i18n'
import { msg } from '../i18n'

/**
 * Runs an action and shows its failure as a toast: the API's `HttpError` carries the
 * server's message ("This poll is closed"), which is what the person needs to read.
 */
export function useRun() {
  const { toast } = useToast()
  return async (action: () => Promise<unknown>, success?: string): Promise<boolean> => {
    try {
      await action()
      if (success) toast({ title: success, variant: 'success', duration: 2500 })
      return true
    } catch (error) {
      toast({
        title: t(msg.actionFailed),
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      })
      return false
    }
  }
}
