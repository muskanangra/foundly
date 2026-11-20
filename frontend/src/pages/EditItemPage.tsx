import { useState, useCallback, useEffect, type ChangeEvent, type DragEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X, ImageIcon, ShieldOff } from 'lucide-react'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Loader'
import { ItemCard } from '../components/feed/ItemCard'
import { useToast } from '../components/ui/Toast'
import { getItem, updateItem } from '../api/items'
import { listCategories } from '../api/categories'
import { ApiError } from '../api/client'
import type { Category, Item } from '../api/types'

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
const NOW = () => new Date().toISOString().slice(0, 16)

type PageStatus = 'loading' | 'success' | 'error' | 'forbidden'

export default function EditItemPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const itemId = Number(id)

  const [pageStatus, setPageStatus] = useState<PageStatus>('loading')
  const [item, setItem] = useState<Item | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [location, setLocation] = useState('')
  const [foundAt, setFoundAt] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    listCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    if (!itemId) { setPageStatus('error'); return }
    getItem(itemId)
      .then((data) => {
        if (!data.is_owner) { setPageStatus('forbidden'); return }
        setItem(data)
        setName(data.name)
        setCategoryId(String(data.category.id))
        setLocation(data.location)
        setFoundAt(data.found_at.slice(0, 16))
        setDescription(data.description ?? '')
        setImagePreview(data.image_url)
        setPageStatus('success')
      })
      .catch(() => setPageStatus('error'))
  }, [itemId])

  const handleFile = useCallback((file: File) => {
    if (!ALLOWED.includes(file.type)) {
      setErrors((e) => ({ ...e, image: 'Only JPEG, PNG and WebP images are allowed.' }))
      return
    }
    if (file.size > MAX_SIZE) {
      setErrors((e) => ({ ...e, image: 'Image must be under 5 MB.' }))
      return
    }
    setErrors((e) => { const n = { ...e }; delete n.image; return n })
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }, [])

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleSubmit = async () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Name is required'
    if (!categoryId) errs.categoryId = 'Category is required'
    if (!location.trim()) errs.location = 'Location is required'
    if (!foundAt) errs.foundAt = 'Found date is required'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      await updateItem(itemId, {
        name: name.trim(),
        description: description.trim(),
        location: location.trim(),
        found_at: foundAt,
        category_id: Number(categoryId),
        ...(imageFile ? { image: imageFile } : {}),
      })
      addToast('success', 'Post updated!')
      navigate(`/items/${itemId}`)
    } catch (err) {
      addToast('error', err instanceof ApiError ? err.detail : 'Failed to update. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (pageStatus === 'loading') {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Skeleton className="mb-8 h-10 w-48 rounded-xl" />
        <div className="flex flex-col gap-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (pageStatus === 'forbidden') {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <EmptyState
          icon={<ShieldOff size={24} aria-hidden="true" />}
          title="Not your post"
          message="You can only edit items you have posted."
          actionLabel="Browse items"
          onAction={() => navigate('/feed')}
        />
      </div>
    )
  }

  if (pageStatus === 'error' || !item) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <ErrorState onRetry={() => navigate(0)} />
      </div>
    )
  }

  const categoryOptions = categories.map((c) => ({ value: String(c.id), label: c.name }))
  const selectedCat = categories.find((c) => c.id === Number(categoryId))
  const previewItem: Item = {
    ...item,
    name: name || item.name,
    location: location || item.location,
    found_at: foundAt || item.found_at,
    image_url: imagePreview ?? item.image_url,
    category: selectedCat ?? item.category,
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 md:py-16">
      <div className="mb-8">
        <h1 className="font-display text-[40px] md:text-[48px] font-semibold text-navy leading-tight">
          Edit post
        </h1>
        <p className="mt-2 font-sans text-base text-sapphire/70">Update the details of your found item.</p>
      </div>

      <div className="grid gap-10 md:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-2 font-sans text-sm font-medium text-sapphire">Photo</p>
            <div className="relative aspect-[4/3] max-w-sm overflow-hidden rounded-2xl bg-champagne border border-taupe/30">
              {imagePreview && (
                <img src={imagePreview} alt="Current" className="h-full w-full object-cover" />
              )}
              <label className="absolute inset-0 flex cursor-pointer items-end justify-end p-2">
                <div
                  onDragEnter={() => setDragging(true)}
                  onDragLeave={() => setDragging(false)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className={`w-full h-full absolute inset-0 flex items-center justify-center transition-colors ${
                    dragging ? 'bg-sapphire/20' : 'bg-transparent hover:bg-navy/5'
                  }`}
                >
                  {!imagePreview && (
                    <div className="flex flex-col items-center gap-2 text-sapphire/60">
                      <ImageIcon size={24} />
                      <p className="font-sans text-xs">Click or drop to change</p>
                    </div>
                  )}
                </div>
                <div className="relative z-10 rounded-full border border-taupe/30 bg-ivory/90 p-1.5 shadow-sm">
                  <X
                    size={14}
                    className="text-navy"
                    onClick={(e) => { e.preventDefault(); setImageFile(null); setImagePreview(item.image_url) }}
                  />
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handleInputChange}
                />
              </label>
            </div>
            {errors.image && (
              <p role="alert" className="mt-1 font-sans text-sm text-danger">{errors.image}</p>
            )}
          </div>

          <Input label="Item name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
          <Select
            label="Category"
            options={[{ value: '', label: 'Select a category…' }, ...categoryOptions]}
            value={categoryId}
            onChange={setCategoryId}
            error={errors.categoryId}
          />
          <Input label="Where was it found?" value={location} onChange={(e) => setLocation(e.target.value)} error={errors.location} />
          <Input label="When was it found?" type="datetime-local" value={foundAt} max={NOW()} onChange={(e) => setFoundAt(e.target.value)} error={errors.foundAt} />
          <Textarea label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />

          <div className="flex gap-3 pt-2">
            <Button variant="primary" size="md" loading={loading} onClick={handleSubmit}>
              {loading ? 'Saving…' : 'Save changes'}
            </Button>
            <Button variant="ghost" size="md" onClick={() => navigate(`/items/${itemId}`)}>Cancel</Button>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-start gap-3">
          <p className="font-sans text-xs text-sapphire/50 uppercase tracking-widest">Preview</p>
          <div className="w-52">
            <ItemCard item={previewItem} showLink={false} />
          </div>
        </div>
      </div>
    </div>
  )
}
