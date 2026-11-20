import { useState, useCallback, useEffect, type ChangeEvent, type DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ImageIcon } from 'lucide-react'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Button } from '../components/ui/Button'
import { ItemCard } from '../components/feed/ItemCard'
import { useToast } from '../components/ui/Toast'
import { createItem } from '../api/items'
import { listCategories } from '../api/categories'
import { ApiError } from '../api/client'
import type { Category, Item } from '../api/types'

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
const NOW = () => new Date().toISOString().slice(0, 16)

export default function PostItemPage() {
  const navigate = useNavigate()
  const { addToast } = useToast()

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

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Name is required'
    if (!categoryId) errs.categoryId = 'Category is required'
    if (!location.trim()) errs.location = 'Location is required'
    if (!foundAt) errs.foundAt = 'Found date is required'
    if (description.trim().length > 0 && description.trim().length < 10)
      errs.description = 'Description must be at least 10 characters'
    if (!imageFile) errs.image = 'An image is required'
    return errs
  }

  const handleSubmit = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      const item = await createItem({
        name: name.trim(),
        description: description.trim(),
        location: location.trim(),
        found_at: foundAt,
        category_id: Number(categoryId),
        image: imageFile!,
      })
      addToast('success', 'Item posted successfully!')
      navigate(`/items/${item.id}`)
    } catch (err) {
      addToast('error', err instanceof ApiError ? err.detail : 'Failed to post item. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const categoryOptions = categories.map((c) => ({ value: String(c.id), label: c.name }))
  const selectedCat = categories.find((c) => c.id === Number(categoryId))
  const previewItem = {
    id: 0,
    name: name || 'Item name',
    location: location || 'Location',
    found_at: foundAt || NOW(),
    image_url: imagePreview ?? '',
    status: 'active' as const,
    is_owner: true,
    description: description,
    created_at: new Date().toISOString(),
    category: selectedCat ?? { id: 0, name: 'Category', slug: '' },
  } satisfies Item

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 md:py-16">
      <div className="mb-8">
        <h1 className="font-display text-[40px] md:text-[48px] font-semibold text-navy leading-tight">
          Post a find
        </h1>
        <p className="mt-2 font-sans text-base text-sapphire/70">
          Help reunite this item with its owner by posting it on Foundly.
        </p>
      </div>

      <div className="grid gap-10 md:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-5">
          {/* Image dropzone */}
          <div>
            <p className="mb-2 font-sans text-sm font-medium text-sapphire">Photo</p>
            {imagePreview ? (
              <div className="relative aspect-[4/3] max-w-sm overflow-hidden rounded-2xl bg-champagne border border-taupe/30">
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                <button
                  onClick={removeImage}
                  aria-label="Remove image"
                  className="absolute right-3 top-3 rounded-full bg-ivory/90 p-1.5 text-navy hover:bg-ivory shadow-sm transition-colors border border-taupe/30"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label>
                <div
                  onDragEnter={() => setDragging(true)}
                  onDragLeave={() => setDragging(false)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-colors ${
                    dragging
                      ? 'border-sapphire bg-champagne'
                      : 'border-taupe bg-champagne hover:border-sapphire/50'
                  }`}
                >
                  <div className="rounded-xl bg-ivory p-3 text-sapphire/60">
                    <ImageIcon size={24} aria-hidden="true" />
                  </div>
                  <div className="text-center">
                    <p className="font-sans text-sm font-medium text-sapphire">
                      <span className="text-navy">Click to upload</span> or drag and drop
                    </p>
                    <p className="mt-0.5 font-sans text-xs text-sapphire/50">
                      JPEG · PNG · WebP · Max 5 MB
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handleInputChange}
                />
              </label>
            )}
            {errors.image && (
              <p role="alert" className="mt-1 font-sans text-sm text-danger">{errors.image}</p>
            )}
          </div>

          <Input
            label="Item name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            placeholder="e.g. Black backpack"
          />
          <Select
            label="Category"
            options={[{ value: '', label: 'Select a category…' }, ...categoryOptions]}
            value={categoryId}
            onChange={setCategoryId}
            error={errors.categoryId}
          />
          <Input
            label="Where was it found?"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            error={errors.location}
            placeholder="e.g. Canteen, Library block B"
          />
          <Input
            label="When was it found?"
            type="datetime-local"
            value={foundAt}
            max={NOW()}
            onChange={(e) => setFoundAt(e.target.value)}
            error={errors.foundAt}
          />
          <Textarea
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={errors.description}
            placeholder="Colour, brand, any identifying features…"
            rows={3}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="primary" size="md" loading={loading} onClick={handleSubmit}>
              {loading ? 'Posting…' : 'Post a find'}
            </Button>
            <Button variant="ghost" size="md" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </div>

        {/* Live preview */}
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
