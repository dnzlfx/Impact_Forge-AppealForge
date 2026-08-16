import { useState } from 'react'
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui'
import { saveConfig } from '../lib/api'

interface ApiKeyModalProps {
  isOpen: boolean
  onConfigSaved: () => void
}

export default function ApiKeyModal({ isOpen, onConfigSaved }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('https://api.featherless.ai/v1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey.trim()) {
      setError('Please enter your Featherless API Key.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await saveConfig(apiKey.trim(), baseUrl.trim())
      onConfigSaved()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <Card className="w-full max-w-lg border-border bg-card shadow-2xl animate-in fade-in zoom-in-95">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-accent/10 text-accent font-bold">
              AI
            </div>
            <div>
              <CardTitle className="text-xl">Featherless API Configuration</CardTitle>
              <CardDescription>
                AppealForge requires a Featherless AI key to synthesize and audit appeals.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <p className="text-xs text-mid">
              Your key will be securely stored locally in the backend <code>.env</code> file. You will not need to enter it again.
            </p>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="featherless-api-key" className="text-xs font-semibold text-deep">
                FEATHERLESS_API_KEY *
              </label>
              <Input
                id="featherless-api-key"
                type="password"
                placeholder="rc_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="featherless-base-url" className="text-xs font-semibold text-deep">
                FEATHERLESS_BASE_URL
              </label>
              <Input
                id="featherless-base-url"
                type="text"
                placeholder="https://api.featherless.ai/v1"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-[4px] border border-flag-red/20 bg-flag-red/5 p-2.5 text-xs text-flag-red">
                {error}
              </div>
            )}

            <div className="mt-2 flex justify-end">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Saving & Verifying...' : 'Save & Start AppealForge'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
