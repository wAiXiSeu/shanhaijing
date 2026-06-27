import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ImageUploader } from '@/components/admin/ImageUploader'

// ── Mock supabase client ──────────────────────────────────────────
const mockUpload = vi.fn()
const mockGetPublicUrl = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

// ── ImageUploader tests ───────────────────────────────────────────

describe('ImageUploader', () => {
  it('renders upload prompt when value is null', () => {
    render(
      <ImageUploader
        bucket="shanhaijing-assets"
        path="creatures/zhulong"
        value={null}
        onChange={() => {}}
      />
    )
    expect(screen.getByText('拖拽或点击上传图片')).toBeInTheDocument()
    expect(screen.getByText(/支持 webp\/jpg\/png/)).toBeInTheDocument()
  })

  it('renders preview image when value is set', () => {
    render(
      <ImageUploader
        bucket="shanhaijing-assets"
        path="creatures/zhulong"
        value="https://example.com/zhulong.webp"
        onChange={() => {}}
      />
    )
    const img = screen.getByAltText('预览')
    expect(img).toHaveAttribute('src', 'https://example.com/zhulong.webp')
    expect(screen.getByText('点击替换')).toBeInTheDocument()
  })

  it('shows remove button when value is set', () => {
    render(
      <ImageUploader
        bucket="shanhaijing-assets"
        path="creatures/zhulong"
        value="https://example.com/zhulong.webp"
        onChange={() => {}}
      />
    )
    expect(screen.getByText('移除图片')).toBeInTheDocument()
  })

  it('does not show remove button when value is null', () => {
    render(
      <ImageUploader
        bucket="shanhaijing-assets"
        path="creatures/zhulong"
        value={null}
        onChange={() => {}}
      />
    )
    expect(screen.queryByText('移除图片')).not.toBeInTheDocument()
  })

  it('calls onChange(null) when remove button is clicked', () => {
    const onChange = vi.fn()
    render(
      <ImageUploader
        bucket="shanhaijing-assets"
        path="creatures/zhulong"
        value="https://example.com/zhulong.webp"
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByText('移除图片'))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('shows error for files larger than 5MB without uploading', () => {
    const onChange = vi.fn()
    render(
      <ImageUploader
        bucket="shanhaijing-assets"
        path="creatures/zhulong"
        value={null}
        onChange={onChange}
      />
    )
    // 6MB file
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'big.png', { type: 'image/png' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [largeFile] } })

    expect(screen.getByText('图片不超过 5MB')).toBeInTheDocument()
    expect(mockUpload).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('uploads file and calls onChange with public URL', async () => {
    mockUpload.mockResolvedValue({ error: null })
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://cdn.example.com/creatures/zhulong.png' },
    })

    const onChange = vi.fn()
    render(
      <ImageUploader
        bucket="shanhaijing-assets"
        path="creatures/zhulong"
        value={null}
        onChange={onChange}
      />
    )
    const file = new File(['image-data'], 'zhulong.png', { type: 'image/png' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith(
        'creatures/zhulong.png',
        file,
        { upsert: true }
      )
    })
    expect(mockGetPublicUrl).toHaveBeenCalledWith('creatures/zhulong.png')
    expect(onChange).toHaveBeenCalledWith('https://cdn.example.com/creatures/zhulong.png')
  })

  it('shows error message when upload fails', async () => {
    mockUpload.mockResolvedValue({ error: { message: 'Storage quota exceeded' } })

    const onChange = vi.fn()
    render(
      <ImageUploader
        bucket="shanhaijing-assets"
        path="creatures/zhulong"
        value={null}
        onChange={onChange}
      />
    )
    const file = new File(['image-data'], 'zhulong.png', { type: 'image/png' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('Storage quota exceeded')).toBeInTheDocument()
    })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('uses webp as default extension when file name has no extension', async () => {
    mockUpload.mockResolvedValue({ error: null })
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://cdn.example.com/creatures/zhulong.webp' },
    })

    const onChange = vi.fn()
    render(
      <ImageUploader
        bucket="shanhaijing-assets"
        path="creatures/zhulong"
        value={null}
        onChange={onChange}
      />
    )
    // File name ending with a dot: split('.').pop() returns '' (falsy) → fallback 'webp'
    const file = new File(['data'], 'zhulong.', { type: 'image/webp' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith(
        'creatures/zhulong.webp',
        file,
        { upsert: true }
      )
    })
  })
})

// ── MarkdownEditor tests ──────────────────────────────────────────
//
// The @uiw/react-md-editor is mocked so we can test the wrapper logic
// (label rendering, prop forwarding) without loading the heavy
// third-party editor in jsdom.

vi.mock('@uiw/react-md-editor', () => ({
  default: function MockMDEditor(props: {
    value?: string
    onChange?: (val?: string) => void
    height?: number
    preview?: string
  }) {
    return (
      <div data-testid="mock-md-editor" data-height={props.height} data-preview={props.preview}>
        <textarea
          data-testid="mock-md-textarea"
          value={props.value || ''}
          onChange={(e) => props.onChange?.(e.target.value)}
        />
      </div>
    )
  },
}))

describe('MarkdownEditor', () => {
  it('renders label when provided', async () => {
    const { MarkdownEditor } = await import('@/components/admin/MarkdownEditor')
    render(<MarkdownEditor value="# Hello" onChange={() => {}} label="正文内容" />)

    await waitFor(() => {
      expect(screen.getByText('正文内容')).toBeInTheDocument()
    })
  })

  it('does not render label when not provided', async () => {
    const { MarkdownEditor } = await import('@/components/admin/MarkdownEditor')
    const { container } = render(
      <MarkdownEditor value="# Hello" onChange={() => {}} />
    )

    await waitFor(() => {
      expect(screen.getByTestId('mock-md-editor')).toBeInTheDocument()
    })
    // No label element
    expect(container.querySelector('label')).toBeNull()
  })

  it('forwards value and onChange to the editor', async () => {
    const { MarkdownEditor } = await import('@/components/admin/MarkdownEditor')
    const onChange = vi.fn()
    render(<MarkdownEditor value="# Title" onChange={onChange} label="内容" />)

    await waitFor(() => {
      expect(screen.getByTestId('mock-md-textarea')).toBeInTheDocument()
    })

    const textarea = screen.getByTestId('mock-md-textarea') as HTMLTextAreaElement
    expect(textarea).toHaveValue('# Title')

    fireEvent.change(textarea, { target: { value: '## Updated' } })
    expect(onChange).toHaveBeenCalledWith('## Updated')
  })

  it('passes height and preview props to the editor', async () => {
    const { MarkdownEditor } = await import('@/components/admin/MarkdownEditor')
    render(<MarkdownEditor value="" onChange={() => {}} />)

    await waitFor(() => {
      const editor = screen.getByTestId('mock-md-editor')
      expect(editor).toHaveAttribute('data-height', '300')
      expect(editor).toHaveAttribute('data-preview', 'live')
    })
  })
})
