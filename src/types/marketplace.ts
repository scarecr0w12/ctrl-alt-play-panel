/**
 * TypeScript type definitions for marketplace integration
 */

// User synchronization types
export interface MarketplaceUser {
  user_id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  profile: {
    bio?: string;
    location?: string;
    website?: string;
    social_links?: Record<string, string>;
  };
  preferences: {
    newsletter: boolean;
    notifications: boolean;
    profile_visibility: 'public' | 'private';
  };
  roles: string[];
  created_at: string;
  updated_at: string;
}

export interface UserSyncRequest {
  user_id: string;
  action: 'create' | 'update' | 'delete';
  user_data: MarketplaceUser;
}

export interface UserSyncResponse {
  success: boolean;
  user_id: string;
  marketplace_user_id: string;
  sync_status: 'synchronized' | 'pending' | 'failed';
  created_at: string;
}

// Plugin publishing types
export interface MarketplacePlugin {
  panel_item_id: string;
  marketplace_item_id?: string;
  user_id: string;
  title: string;
  description: string;
  category_id: string;
  tags: string[];
  price: number;
  currency: string;
  license_type: 'free' | 'commercial' | 'royalty-free';
  files: PluginFile[];
  screenshots: PluginScreenshot[];
  metadata: Record<string, unknown>;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface PluginFile {
  name: string;
  size: number;
  type: string;
  url: string;
  checksum: string;
}

export interface PluginScreenshot {
  url: string;
  alt: string;
  order: number;
}

export interface PluginPublishRequest {
  panel_item_id: string;
  user_id: string;
  item_data: Omit<MarketplacePlugin, 'panel_item_id' | 'marketplace_item_id' | 'user_id'>;
}

export interface PluginPublishResponse {
  success: boolean;
  marketplace_item_id: string;
  panel_item_id: string;
  status: 'published' | 'pending' | 'rejected';
  marketplace_url: string;
  published_at: string;
}

// Analytics types
export interface PluginAnalytics {
  item_id: string;
  panel_item_id: string;
  analytics: {
    views: {
      total: number;
      unique: number;
      today: number;
      this_week: number;
      this_month: number;
    };
    downloads: {
      total: number;
      today: number;
      this_week: number;
      this_month: number;
    };
    revenue: {
      total: number;
      today: number;
      this_week: number;
      this_month: number;
    };
    ratings: {
      average: number;
      count: number;
      distribution: Record<string, number>;
    };
    geographic_data: Array<{
      country: string;
      downloads: number;
    }>;
  };
  last_updated: string;
}

// Service authentication types
export interface ServiceAuthToken {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string[];
  issued_at: string;
}

export interface ServiceJWTPayload {
  iss: string; // issuer (panel.ctrl-alt-play.com)
  aud: string; // audience (marketplace.ctrl-alt-play.com)
  sub: string; // subject (service-integration)
  exp: number; // expiration time
  iat: number; // issued at time
  service_id: string; // panel-system
  permissions: string[]; // service permissions
}

// Integration configuration
export interface MarketplaceConfig {
  base_url: string;
  api_version: string;
  service_id: string;
  api_key: string;
  jwt_secret: string;
  timeout: number;
  retry_attempts: number;
  retry_delay: number;
}

// API response wrapper
export interface MarketplaceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    request_id: string;
    timestamp: string;
  };
}

// Webhook types
export interface WebhookEvent {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface ItemPurchaseEvent extends WebhookEvent {
  event: 'item.purchased';
  data: {
    purchase_id: string;
    item_id: string;
    panel_item_id: string;
    buyer_id: string;
    price: number;
    currency: string;
    commission: number;
    net_amount: number;
  };
}

export interface ItemReviewEvent extends WebhookEvent {
  event: 'item.reviewed';
  data: {
    review_id: string;
    item_id: string;
    panel_item_id: string;
    reviewer_id: string;
    rating: number;
    comment: string;
    verified_purchase: boolean;
  };
}

export interface UserRegistrationEvent extends WebhookEvent {
  event: 'user.registered';
  data: {
    user_id: string;
    email: string;
    username: string;
    registration_source: string;
    referred_by: string | null;
  };
}

// Error types
export enum MarketplaceErrorCode {
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export class MarketplaceError extends Error {
  constructor(
    public code: MarketplaceErrorCode,
    message: string,
    public details?: Record<string, unknown>,
    public request_id?: string
  ) {
    super(message);
    this.name = 'MarketplaceError';
  }
}

// Search and discovery types
export interface PluginSearchQuery {
  q?: string;
  category?: string;
  tags?: string[];
  price_min?: number;
  price_max?: number;
  sort?: 'relevance' | 'price' | 'date' | 'rating' | 'downloads';
  limit?: number;
  offset?: number;
}

export interface PluginSearchResult {
  items: MarketplacePlugin[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
  facets: {
    categories: Array<{ id: string; name: string; count: number }>;
    price_ranges: Array<{ min: number; max: number; count: number }>;
    tags: Array<{ name: string; count: number }>;
  };
}

// Category synchronization
export interface MarketplaceCategory {
  panel_id: string;
  marketplace_id?: string;
  name: string;
  slug: string;
  description: string;
  parent_id: string | null;
  icon_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategorySyncRequest {
  categories: MarketplaceCategory[];
}

export interface CategorySyncResponse {
  success: boolean;
  synchronized_categories: Array<{
    panel_id: string;
    marketplace_id: string;
    status: 'created' | 'updated' | 'skipped';
  }>;
  errors: Array<{
    panel_id: string;
    error: string;
  }>;
}

// Organization/multi-tenancy types (for future enterprise features)
export interface Organization {
  id: string;
  name: string;
  slug: string;
  settings: {
    marketplace_integration: boolean;
    auto_publish_plugins: boolean;
    require_approval: boolean;
    branding: {
      logo_url?: string;
      primary_color?: string;
      secondary_color?: string;
    };
  };
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'developer' | 'member';
  permissions: string[];
  created_at: string;
  updated_at: string;
}
