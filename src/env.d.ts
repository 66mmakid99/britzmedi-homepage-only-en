/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// Cloudflare D1 Database type
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  error?: string;
  meta?: {
    duration: number;
    changes: number;
    last_row_id: number;
    changed_db: boolean;
    size_after: number;
    rows_read: number;
    rows_written: number;
  };
}

interface D1ExecResult {
  count: number;
  duration: number;
}

// Cloudflare KV Namespace type
interface KVNamespace {
  get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream'; cacheTtl?: number }): Promise<string | object | ArrayBuffer | ReadableStream | null>;
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: { expiration?: number; expirationTtl?: number; metadata?: object }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: { name: string; expiration?: number; metadata?: object }[]; list_complete: boolean; cursor?: string }>;
}

// Cloudflare R2 Bucket type
interface R2Bucket {
  put(key: string, value: ArrayBuffer | ReadableStream | string | Blob, options?: R2PutOptions): Promise<R2Object>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(key: string | string[]): Promise<void>;
  list(options?: R2ListOptions): Promise<R2Objects>;
  head(key: string): Promise<R2Object | null>;
}

interface R2PutOptions {
  httpMetadata?: { contentType?: string; contentDisposition?: string; contentEncoding?: string; cacheControl?: string };
  customMetadata?: Record<string, string>;
}

interface R2Object {
  key: string;
  size: number;
  etag: string;
  httpEtag: string;
  uploaded: Date;
  httpMetadata?: { contentType?: string };
  customMetadata?: Record<string, string>;
}

interface R2ObjectBody extends R2Object {
  body: ReadableStream;
  bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  json<T = unknown>(): Promise<T>;
  blob(): Promise<Blob>;
}

interface R2ListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
  delimiter?: string;
}

interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
  delimitedPrefixes: string[];
}

// Cloudflare Runtime Environment
interface CloudflareEnv {
  DB: D1Database;
  KV: KVNamespace;
  SESSION: KVNamespace;
  BLOG_IMAGES: R2Bucket;
  ANTHROPIC_API_KEY?: string;
  GEMINI_API_KEY?: string;
  ADMIN_PASSWORD?: string;
  SLACK_WEBHOOK_URL?: string;
  RESEND_API_KEY?: string;
  ADMIN_EMAIL?: string;
  GITHUB_TOKEN?: string;
  GITHUB_REPO?: string;
  TWITTER_API_KEY?: string;
  TWITTER_API_SECRET?: string;
  TWITTER_ACCESS_TOKEN?: string;
  TWITTER_ACCESS_TOKEN_SECRET?: string;
  LINKEDIN_CLIENT_ID?: string;
  LINKEDIN_CLIENT_SECRET?: string;
  INSTAGRAM_APP_ID?: string;
  INSTAGRAM_APP_SECRET?: string;
  INSTAGRAM_ACCESS_TOKEN?: string;
}

// Extend Astro's Locals
declare namespace App {
  interface Locals {
    runtime: {
      env: CloudflareEnv;
      ctx: ExecutionContext;
      cf: IncomingRequestCfProperties;
    };
  }
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

interface IncomingRequestCfProperties {
  asn?: number;
  asOrganization?: string;
  city?: string;
  clientAcceptEncoding?: string;
  clientTcpRtt?: number;
  colo?: string;
  continent?: string;
  country?: string;
  httpProtocol?: string;
  latitude?: string;
  longitude?: string;
  metroCode?: string;
  postalCode?: string;
  region?: string;
  regionCode?: string;
  timezone?: string;
  tlsCipher?: string;
  tlsClientAuth?: object;
  tlsVersion?: string;
}
