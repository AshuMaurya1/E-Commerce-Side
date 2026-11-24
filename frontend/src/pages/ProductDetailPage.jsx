import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Heart, Minus, Plus, ShoppingBag, Star, Trash2 } from 'lucide-react';
import { catalogService } from '../services/catalogService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { extractErrorMessage, formatCurrency, formatDate } from '../utils/format';
import { ProductCard } from '../components/ProductCard';
import { PageSpinner } from '../components/Skeletons';

export function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addToCart, toggleWishlist, wishlistIds } = useCart();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState({ items: [], totalElements: 0 });
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  // Review form
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      setSelectedImage(0);
      setQuantity(1);
      try {
        const prod = await catalogService.getProductDetail(slug);
        if (!active) return;
        setProduct(prod);
        const [rel, rev] = await Promise.all([
          catalogService.getRelatedProducts(prod.id),
          catalogService.getProductReviews(prod.id, 0, 10),
        ]);
        if (!active) return;
        setRelated(rel || []);
        setReviews(rev || { items: [], totalElements: 0 });
      } catch (err) {
        if (active) setError(extractErrorMessage(err, 'Product not found'));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) return <PageSpinner />;
  if (error || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-zinc-900">{error || 'Product not found'}</h1>
        <Link to="/products" className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline">
          Return to catalog
        </Link>
      </div>
    );
  }

  const images = product.images?.length
    ? product.images
    : [{ id: 0, imageUrl: '', altText: product.name }];
  const activeImage = images[selectedImage] || images[0];
  const hasDiscount = product.discountPrice != null && Number(product.discountPrice) < Number(product.price);
  const isSaved = wishlistIds.has(product.id);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setAdding(true);
    await addToCart(product.id, quantity);
    setAdding(false);
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/checkout', {
      state: {
        directItem: {
          productId: product.id,
          productName: product.name,
          imageUrl: activeImage.imageUrl,
          unitPrice: product.effectivePrice,
          quantity,
        },
      },
    });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await catalogService.createReview({
        productId: product.id,
        rating,
        title: reviewTitle.trim() || null,
        comment: reviewComment.trim(),
      });
      toast.success('Thank you for your review');
      setReviewTitle('');
      setReviewComment('');
      const [updatedProd, updatedReviews] = await Promise.all([
        catalogService.getProductDetail(slug),
        catalogService.getProductReviews(product.id, 0, 10),
      ]);
      setProduct(updatedProd);
      setReviews(updatedReviews);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Could not submit review'));
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await catalogService.deleteReview(reviewId);
      toast.info('Review deleted');
      const [updatedProd, updatedReviews] = await Promise.all([
        catalogService.getProductDetail(slug),
        catalogService.getProductReviews(product.id, 0, 10),
      ]);
      setProduct(updatedProd);
      setReviews(updatedReviews);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-6">
        <Link to="/" className="hover:text-navy">Home</Link>
        <span>/</span>
        <Link to={`/products?category=${encodeURIComponent(product.categorySlug)}`} className="hover:text-navy">
          {product.categoryName}
        </Link>
        <span>/</span>
        <span className="text-zinc-900 truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Image Gallery */}
        <div className="lg:col-span-6 space-y-3">
          <div className="aspect-[4/3] overflow-hidden rounded-md border border-zinc-200 bg-white">
            {activeImage.imageUrl ? (
              <img
                src={activeImage.imageUrl}
                alt={activeImage.altText || product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400">
                No product image
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => setSelectedImage(idx)}
                  className={`h-20 w-24 shrink-0 overflow-hidden rounded border ${
                    idx === selectedImage ? 'border-navy ring-1 ring-navy' : 'border-zinc-200'
                  }`}
                >
                  <img src={img.imageUrl} alt={img.altText || product.name} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="lg:col-span-6 space-y-5">
          <div>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span>{product.categoryName}</span>
              {product.brand && (
                <>
                  <span>&middot;</span>
                  <span>{product.brand}</span>
                </>
              )}
              <span>&middot;</span>
              <span className="font-mono">SKU: {product.sku}</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-navy">{product.name}</h1>

            <div className="mt-3 flex items-center gap-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(Number(product.averageRating))
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-zinc-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-zinc-600">
                {Number(product.averageRating).toFixed(1)} ({product.reviewCount} reviews)
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-3 border-y border-zinc-200 py-4">
            <span className="text-2xl font-semibold text-zinc-900">
              {formatCurrency(product.effectivePrice)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-base text-zinc-400 line-through">
                  {formatCurrency(product.price)}
                </span>
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  Save {formatCurrency(Number(product.price) - Number(product.discountPrice))}
                </span>
              </>
            )}
          </div>

          <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
            {product.description}
          </p>

          <div className="flex items-center gap-2 text-sm">
            {product.inStock ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                <Check className="h-4 w-4" />
                In stock ({product.stockQuantity} available)
              </span>
            ) : (
              <span className="font-medium text-red-600">Currently out of stock</span>
            )}
          </div>

          {/* Quantity & CTAs */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-md border border-zinc-300 bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={!product.inStock || quantity <= 1}
                  className="p-2.5 text-zinc-600 hover:text-zinc-900 disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                  disabled={!product.inStock || quantity >= product.stockQuantity}
                  className="p-2.5 text-zinc-600 hover:text-zinc-900 disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!product.inStock || adding}
                className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 rounded-md bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-800 disabled:bg-zinc-200 disabled:text-zinc-500 transition-colors"
              >
                <ShoppingBag className="h-4 w-4" />
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!product.inStock}
                className="flex-1 min-w-[140px] inline-flex items-center justify-center rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-zinc-200 disabled:text-zinc-500 transition-colors"
              >
                Buy Now
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                aria-label="Toggle wishlist"
                className={`inline-flex items-center justify-center rounded-md border p-2.5 ${
                  isSaved
                    ? 'border-red-200 bg-red-50 text-red-600'
                    : 'border-zinc-300 bg-white text-zinc-700 hover:bg-surface'
                }`}
              >
                <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews */}
      <section className="mt-14 border-t border-zinc-200 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <h2 className="text-lg font-semibold text-navy">Customer Reviews</h2>
            <p className="mt-1 text-sm text-zinc-600">
              {Number(product.averageRating).toFixed(1)} out of 5 stars based on {product.reviewCount} reviews
            </p>

            {isAuthenticated ? (
              <form onSubmit={handleSubmitReview} className="mt-6 rounded-md border border-zinc-200 bg-white p-5 space-y-4">
                <h3 className="text-sm font-semibold text-zinc-900">Write a Review</h3>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Rating</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value={5}>5 Stars — Excellent</option>
                    <option value={4}>4 Stars — Very Good</option>
                    <option value={3}>3 Stars — Average</option>
                    <option value={2}>2 Stars — Fair</option>
                    <option value={1}>1 Star — Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Title (optional)</label>
                  <input
                    type="text"
                    maxLength={160}
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="Summary of your experience"
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Review</label>
                  <textarea
                    required
                    minLength={5}
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share how this product performs..."
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div className="mt-6 rounded-md border border-zinc-200 bg-white p-5">
                <p className="text-sm text-zinc-600">
                  <Link to="/login" className="font-medium text-emerald-700 hover:underline">
                    Sign in
                  </Link>{' '}
                  to leave a verified review for this product.
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 space-y-4">
            {reviews.items.length === 0 ? (
              <div className="rounded-md border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
                No reviews yet. Be the first to review this product.
              </div>
            ) : (
              reviews.items.map((rev) => (
                <div key={rev.id} className="rounded-md border border-zinc-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-900">{rev.reviewerName}</span>
                        {rev.verifiedPurchase && (
                          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-xs text-zinc-400">{formatDate(rev.createdAt)}</span>
                      </div>
                    </div>
                    {user?.id === rev.userId && (
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(rev.id)}
                        className="text-zinc-400 hover:text-red-600"
                        aria-label="Delete review"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {rev.title && <p className="mt-2.5 text-sm font-medium text-zinc-900">{rev.title}</p>}
                  <p className="mt-1 text-sm text-zinc-700 leading-relaxed">{rev.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-14 border-t border-zinc-200 pt-10">
          <h2 className="text-lg font-semibold text-navy mb-5">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {related.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
