import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EspressoOmnibox from '@/components/scan/omnibox/espressoomnibox'
import { NetworkProvider } from '@/contexts/networkcontext'


vi.mock('@/services/api/espressoapi', () => ({
  search: vi.fn(),
  formatBlockTime: vi.fn(() => '1 min ago'),
  formatTransactionHash: vi.fn((hash) => hash.substring(0, 10) + '...'),
  getCurrentNetwork: vi.fn(() => ({ name: 'Mainnet', baseUrl: 'https://query.main.net.espresso.network', apiVersion: 'v0', wsBaseUrl: 'wss://query.main.net.espresso.network', scanBaseUrl: 'https://explorer.main.net.espresso.network', webWorkerUrl: 'https://explorer.main.net.espresso.network/assets/node_validator_web_worker_api.js-bT9djMJi.js' })),
  setNetwork: vi.fn()
}))

vi.mock('@/services/api/rollupresolver', () => ({
  resolveRollupName: vi.fn(() => 360),
  getRollupName: vi.fn(() => 'MOLTEN'),
  isRollupResolverReady: vi.fn(() => true),
  initializeRollupResolver: vi.fn()
}))


const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <NetworkProvider>{children}</NetworkProvider>
)

describe('EspressoOmnibox', () => {
  it('should render search input', () => {
    render(
      <TestWrapper>
        <EspressoOmnibox />
      </TestWrapper>
    )
    
    const searchInput = screen.getByPlaceholderText(/Block height, TX hash, or rollup name/i)
    expect(searchInput).toBeInTheDocument()
  })

  it('should show search results on focus', async () => {
    render(
      <TestWrapper>
        <EspressoOmnibox />
      </TestWrapper>
    )
    
    const searchInput = screen.getByPlaceholderText(/Block height, TX hash, or rollup name/i)
    
    await userEvent.click(searchInput)
    

    await waitFor(() => {
      expect(screen.getByText(/Enter a search term to explore/i)).toBeInTheDocument()
    })
  })

  it('should detect block search pattern', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <EspressoOmnibox />
      </TestWrapper>
    )
    
    const searchInput = screen.getByPlaceholderText(/Block height, TX hash, or rollup name/i)
    
    await user.click(searchInput)
    await user.type(searchInput, '123456')
    

    await waitFor(() => {
      expect(searchInput).toHaveValue('123456')
    })
  })

  it('should detect transaction search pattern', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <EspressoOmnibox />
      </TestWrapper>
    )
    
    const searchInput = screen.getByPlaceholderText(/Block height, TX hash, or rollup name/i)
    
    await user.click(searchInput)
    await user.type(searchInput, 'TX~abc123')
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('TX~abc123')
    })
  })

  it('should detect rollup name search pattern', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <EspressoOmnibox />
      </TestWrapper>
    )
    
    const searchInput = screen.getByPlaceholderText(/Block height, TX hash, or rollup name/i)
    
    await user.click(searchInput)
    await user.type(searchInput, 'MOLTEN')
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('MOLTEN')
    })
  })

  it('should show network information', async () => {
    render(
      <TestWrapper>
        <EspressoOmnibox />
      </TestWrapper>
    )
    
    const searchInput = screen.getByPlaceholderText(/Block height, TX hash, or rollup name/i)
    await userEvent.click(searchInput)
    
    await waitFor(() => {
      expect(screen.getByText(/Real-time data/i)).toBeInTheDocument()
    })
  })
})