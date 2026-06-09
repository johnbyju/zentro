'use client';

import React, { useState, useMemo } from 'react';
import { 
  Code, FileText, Database, Layers, Eye, Music, Sparkles, BookOpen, 
  Settings, Lock, Presentation, Search, ChevronRight, ArrowLeft, Cpu
} from 'lucide-react';

// Import subcomponents
import DevUtilities from './tools/DevUtilities';
import CodeIntelligence from './tools/CodeIntelligence';
import WritingLanguage from './tools/WritingLanguage';
import AiSimulationConsole from './tools/AiSimulationConsole';

// Category Definition
interface ToolCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const CATEGORIES: ToolCategory[] = [
  { id: 'code-intel', name: 'Code Intelligence', icon: <Code size={16} />, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { id: 'writing-lang', name: 'Writing & Language', icon: <FileText size={16} />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { id: 'data-spreadsheets', name: 'Data & Sheets', icon: <Database size={16} />, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { id: 'documents-pdf', name: 'Documents & PDF', icon: <Layers size={16} />, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { id: 'vision-image', name: 'Vision & Image', icon: <Eye size={16} />, color: 'text-[#6DD3FF] bg-[#6DD3FF]/10 border-[#6DD3FF]/20' },
  { id: 'audio-voice', name: 'Audio & Voice', icon: <Music size={16} />, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  { id: 'image-generation', name: 'Image Generation', icon: <Sparkles size={16} />, color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  { id: 'knowledge-search', name: 'Knowledge & Search', icon: <BookOpen size={16} />, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
  { id: 'dev-utilities', name: 'Dev Utilities', icon: <Settings size={16} />, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  { id: 'privacy-security', name: 'Privacy & Security', icon: <Lock size={16} />, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  { id: 'presentations', name: 'Presentations', icon: <Presentation size={16} />, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
];

interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  module: 'dev' | 'code' | 'write' | 'sim';
}

const TOOLS: ToolDefinition[] = [
  // --- Code Intelligence ---
  { id: 'regex-tester', name: 'Regex Sandbox', description: 'Test and compile regular expressions with live highlights.', category: 'code-intel', module: 'code' },
  { id: 'sql-query', name: 'SQL Query Assistant', description: 'Write, debug, and optimize database SQL commands.', category: 'code-intel', module: 'code' },
  { id: 'code-explainer', name: 'Code Explainer', description: 'Analyze script blocks step-by-step and write documentation.', category: 'code-intel', module: 'code' },
  { id: 'code-translator', name: 'Code Translator', description: 'Translate functions from one programming syntax to another.', category: 'code-intel', module: 'code' },
  { id: 'unit-tester', name: 'Unit Test Generator', description: 'Automatically build testing assertions for standard scripts.', category: 'code-intel', module: 'code' },
  { id: 'commit-writer', name: 'Conventional Commit Writer', description: 'Format standard commit headers and changelogs from diffs.', category: 'code-intel', module: 'code' },
  { id: 'bug-finder', name: 'Offline Bug Finder', description: 'Perform structural scans to spot logical fallbacks and race conditions.', category: 'code-intel', module: 'sim' },
  { id: 'code-refactor', name: 'AI Code Refactorer', description: 'Restructure algorithms for lower memory footprint and latency.', category: 'code-intel', module: 'sim' },

  // --- Writing & Language ---
  { id: 'markdown-studio', name: 'Markdown Studio', description: 'Edit and render HTML markdown documents side-by-side.', category: 'writing-lang', module: 'write' },
  { id: 'writing-stats', name: 'Text Case & Stats Converter', description: 'Compute character occurrences and format text cases.', category: 'writing-lang', module: 'write' },
  { id: 'prompt-improver', name: 'Prompt Optimizer', description: 'Draft advanced prompt queries for optimized LLM processing.', category: 'writing-lang', module: 'write' },
  { id: 'email-assistant', name: 'AI Email Draftsman', description: 'Write or compose context-rich professional replies in seconds.', category: 'writing-lang', module: 'write' },
  { id: 'word-translator', name: 'Multi-Language Translator', description: 'Translate vocabulary blocks and paragraphs offline.', category: 'writing-lang', module: 'write' },
  { id: 'resume-optimizer', name: 'Resume & CV Enhancer', description: 'Format and structure professional profiles for recruiters.', category: 'writing-lang', module: 'sim' },
  { id: 'grammar-style', name: 'Grammar & Style Fixer', description: 'Audit write-ups for syntax flow, tone consistency, and metrics.', category: 'writing-lang', module: 'sim' },
  { id: 'blog-writer', name: 'AI Article Composer', description: 'Generate outlines and core content drafts for topics.', category: 'writing-lang', module: 'sim' },

  // --- Data & Sheets ---
  { id: 'csv-json', name: 'CSV ↔ JSON Parser', description: 'Instantly restructure rows back and forth from comma schemas.', category: 'data-spreadsheets', module: 'dev' },
  { id: 'excel-formula', name: 'Sheets Formula Builder', description: 'Write standard calculation strings from clear instructions.', category: 'data-spreadsheets', module: 'sim' },
  { id: 'data-cleaner', name: 'Offline Data Scrubbing', description: 'Filter invalid schemas, parse formats, and clean tables.', category: 'data-spreadsheets', module: 'sim' },
  { id: 'chart-builder', name: 'Interactive Graph Generator', description: 'Load tabular data entries to draw dynamic metrics.', category: 'data-spreadsheets', module: 'sim' },
  { id: 'json-to-xml', name: 'JSON ↔ XML Parser', description: 'Convert tags and nodes offline between markup syntax.', category: 'data-spreadsheets', module: 'sim' },
  { id: 'yaml-json', name: 'YAML ↔ JSON Converter', description: 'Map indentation layers to brackets configuration structures.', category: 'data-spreadsheets', module: 'sim' },

  // --- Documents & PDF ---
  { id: 'doc-scanner', name: 'AI OCR Doc Scanner', description: 'Recognize character letters from raw image files offline.', category: 'documents-pdf', module: 'sim' },
  { id: 'pdf-compress', name: 'PDF File Compressor', description: 'Reduce local PDF byte footprint size for attachments.', category: 'documents-pdf', module: 'sim' },
  { id: 'pdf-extract', name: 'PDF Metadata Stripper', description: 'Extract core text content and document parameters.', category: 'documents-pdf', module: 'sim' },
  { id: 'markdown-pdf', name: 'Markdown to PDF', description: 'Generate formatted PDF files from styled markdown text.', category: 'documents-pdf', module: 'sim' },
  { id: 'pdf-merge', name: 'PDF Splitter & Merger', description: 'Combine document batches or select specific pages to export.', category: 'documents-pdf', module: 'sim' },

  // --- Vision & Image ---
  { id: 'bg-remover', name: 'AI Background Remover', description: 'Extract subject foregrounds using edge separation layers.', category: 'vision-image', module: 'sim' },
  { id: 'img-upscale', name: 'AI Image Upscaler (4x HD)', description: 'Interpolate pixel resolutions to produce clean HD files.', category: 'vision-image', module: 'sim' },
  { id: 'object-detect', name: 'AI Object Classifier', description: 'Scan items to identify and label classes within frame bounds.', category: 'vision-image', module: 'sim' },
  { id: 'svg-optimizer', name: 'SVG Path Optimizer', description: 'Strip nested node layouts to minimize vectors download sizes.', category: 'vision-image', module: 'sim' },
  { id: 'favicon-gen', name: 'Favicon Studio Creator', description: 'Build customized multi-resolution desktop task icons.', category: 'vision-image', module: 'sim' },

  // --- Audio & Voice ---
  { id: 'meeting-assistant', name: 'AI Audio Meeting Notes', description: 'Transcribe recordings to clean summaries and bullet tasks.', category: 'audio-voice', module: 'sim' },
  { id: 'voice-recorder', name: 'Voice Recorder Studio', description: 'Record waveforms offline in raw web audio buffers.', category: 'audio-voice', module: 'sim' },
  { id: 'text-to-speech', name: 'Offline Audio Synth', description: 'Synthesize custom text paragraphs to readable speech waves.', category: 'audio-voice', module: 'sim' },
  { id: 'audio-converter', name: 'WAV ↔ MP3 Transcoder', description: 'Adjust sample rate quality layers and compile codec changes.', category: 'audio-voice', module: 'sim' },

  // --- Image Generation ---
  { id: 'pixel-art', name: 'AI Pixel Art Maker', description: 'Render custom prompt ideas to 8-bit grids pixel files.', category: 'image-generation', module: 'sim' },
  { id: 'avatar-studio', name: 'Avatar Vector Studio', description: 'Build unique illustrated identity faces using base vectors.', category: 'image-generation', module: 'sim' },
  { id: 'logo-creator', name: 'AI Logo Draftsman', description: 'Generate initial brand logo concepts based on prompt details.', category: 'image-generation', module: 'sim' },
  { id: 'banner-designer', name: 'Promotions Banner Composer', description: 'Build grid layouts for advertisement content drafts.', category: 'image-generation', module: 'sim' },

  // --- Knowledge & Search ---
  { id: 'semantic-search', name: 'Semantic File Indexer', description: 'Search directory documents conceptually without literal matches.', category: 'knowledge-search', module: 'sim' },
  { id: 'wikipedia-offline', name: 'Offline Wiki Reader', description: 'Query compiled local index summaries for generic entities.', category: 'knowledge-search', module: 'sim' },
  { id: 'book-summarizer', name: 'AI Book Reviewer', description: 'Analyze literature works structures to compile chapter reviews.', category: 'knowledge-search', module: 'sim' },
  { id: 'research-assistant', name: 'AI Citations Generator', description: 'Format standard bibliography indexes and notes formats.', category: 'knowledge-search', module: 'sim' },

  // --- Dev Utilities ---
  { id: 'json-beautifier', name: 'JSON Prettify & Validator', description: 'Format, validate, and parse raw payload blocks.', category: 'dev-utilities', module: 'dev' },
  { id: 'api-tester', name: 'HTTP Client Playground', description: 'Send network requests and debug status responses.', category: 'dev-utilities', module: 'dev' },
  { id: 'base64-encode', name: 'Base64 Encoder / Decoder', description: 'Convert string characters to standard base64 structures.', category: 'dev-utilities', module: 'dev' },
  { id: 'hash-gen', name: 'Cryptographic Hasher', description: 'Calculate MD5, SHA-1, SHA-256, and SHA-512 hashes.', category: 'dev-utilities', module: 'dev' },
  { id: 'color-studio', name: 'Color CSS Studio', description: 'Convert color palettes and write shadow box CSS properties.', category: 'dev-utilities', module: 'dev' },
  { id: 'diff-viewer', name: 'Visual Diff Highlighter', description: 'Compute side-by-side string differences line by line.', category: 'dev-utilities', module: 'dev' },
  { id: 'js-repl', name: 'JavaScript REPL Console', description: 'Evaluate scripts safely in a mock client sandbox.', category: 'dev-utilities', module: 'dev' },
  { id: 'live-preview', name: 'HTML / CSS Live Frame', description: 'Write markup assets and preview output render windows.', category: 'dev-utilities', module: 'dev' },
  { id: 'password-gen', name: 'Password Generator Studio', description: 'Generate custom cryptographically secure passwords.', category: 'dev-utilities', module: 'dev' },
  { id: 'cron-builder', name: 'Cron Expression Builder', description: 'Understand and build task intervals cron parameters.', category: 'dev-utilities', module: 'dev' },

  // --- Privacy & Security ---
  { id: 'aes-encrypt', name: 'AES-256 Vault Encryption', description: 'Password protect local strings using standard block crypts.', category: 'privacy-security', module: 'sim' },
  { id: 'meta-stripper', name: 'EXIF Metadata Cleaner', description: 'Scrub geographic metrics and device traces from images.', category: 'privacy-security', module: 'sim' },
  { id: 'leak-checker', name: 'Credentials Leak Scanner', description: 'Verify password hashes against public vulnerability lists.', category: 'privacy-security', module: 'sim' },
  { id: 'key-generator', name: 'SSH & GPG Keys Studio', description: 'Generate asymmetric key pairs for system authentications.', category: 'privacy-security', module: 'sim' },

  // --- Presentations ---
  { id: 'deck-builder', name: 'AI Presentation Slides Outline', description: 'Structure logical deck outlines for slide structures.', category: 'presentations', module: 'sim' },
  { id: 'mindmap-gen', name: 'Mindmap Node Tree Builder', description: 'Formulate concept bubbles diagrams from topic ideas.', category: 'presentations', module: 'sim' },
  { id: 'flowchart-builder', name: 'Mermaid Flowchart Generator', description: 'Generate formatted diagram scripts for process flows.', category: 'presentations', module: 'sim' },
];

// Configuration templates for simulated heavy ML components
const AI_SIM_CONFIGS: Record<string, any> = {
  'bug-finder': {
    id: 'bug-finder',
    name: 'Offline Bug Finder',
    description: 'Scan code syntax trees locally to locate memory leaks, logic bugs, unhandled exception paths, or race conditions.',
    inputFileType: 'text',
    sliders: [
      { label: 'Scanner Depth', min: 1, max: 10, step: 1, defaultValue: 5, unit: ' AST Levels' }
    ],
    steps: [
      'Tokenizing input code blocks...',
      'Compiling abstract syntax tree (AST)...',
      'Comparing structures against offline vulnerability templates...',
      'Validating memory allocation bounds...'
    ],
    successMessage: 'Analysis complete. 0 bugs found in active module scope.',
    mockResultType: 'document_qa'
  },
  'code-refactor': {
    id: 'code-refactor',
    name: 'AI Code Refactorer',
    description: 'Rebuild coding blocks to optimize speed bottlenecks, clean up structural loops, and reduce stack footprints.',
    inputFileType: 'text',
    steps: [
      'Compiling code paths...',
      'Detecting structural loop arrays...',
      'Optimizing cache localities...',
      'Re-writing simplified expression lines...'
    ],
    successMessage: 'Refactoring script constructed. Core logic has been simplified successfully.',
    mockResultType: 'document_qa'
  },
  'resume-optimizer': {
    id: 'resume-optimizer',
    name: 'Resume & CV Enhancer',
    description: 'Scrub resume documents and compare items with professional standards to suggest optimizations.',
    inputFileType: 'pdf',
    steps: [
      'Extracting document content layouts...',
      'Compiling semantic vector nodes...',
      'Measuring standard workplace keyword densities...',
      'Formulating vocabulary enhancements...'
    ],
    successMessage: 'Resume review generated. Suggestions updated in local console output.',
    mockResultType: 'document_qa'
  },
  'grammar-style': {
    id: 'grammar-style',
    name: 'Grammar & Style Fixer',
    description: 'Audit paragraphs for readability index metrics, lexical diversity ratios, and tone style rules.',
    inputFileType: 'text',
    steps: [
      'Evaluating syntax structures...',
      'Spotting spelling anomalies...',
      'Measuring Flesch-Kincaid grade level index...',
      'Structuring stylistic overrides...'
    ],
    successMessage: 'Proofread complete. Checked 3 paragraphs without error flags.',
    mockResultType: 'document_qa'
  },
  'blog-writer': {
    id: 'blog-writer',
    name: 'AI Article Composer',
    description: 'Structure outline parameters, hook templates, and drafting blocks for specified article content tags.',
    inputFileType: 'text',
    steps: [
      'Mapping article structure...',
      'Drafting introductory headings...',
      'Injecting supportive outlines details...',
      'Compiling formatting layout styles...'
    ],
    successMessage: 'Blog draft created. Outline and structure output finalized.',
    mockResultType: 'document_qa'
  },
  'excel-formula': {
    id: 'excel-formula',
    name: 'Sheets Formula Builder',
    description: 'Write formulas for Microsoft Excel or Google Sheets by translating calculations instructions.',
    inputFileType: 'text',
    steps: [
      'Mapping functional cells criteria...',
      'Building nested conditional logic blocks...',
      'Validating syntax parameters boundaries...'
    ],
    successMessage: 'Formula string constructed: =IFS(A2="Active", SUM(B2:B10), TRUE, 0)',
    mockResultType: 'document_qa'
  },
  'data-cleaner': {
    id: 'data-cleaner',
    name: 'Offline Data Scrubbing',
    description: 'Analyze spreadsheet rows and values to identify duplicates, fix mismatched column types, and normalize datetimes.',
    inputFileType: 'any',
    steps: [
      'Loading data schemas...',
      'Identifying string type fields mismatch...',
      'Locating empty data cells blocks...',
      'Purging duplicate entries...'
    ],
    successMessage: 'Spreadsheet rows sanitized. 3 empty values filled with default placeholders.',
    mockResultType: 'document_qa'
  },
  'chart-builder': {
    id: 'chart-builder',
    name: 'Interactive Graph Generator',
    description: 'Load custom spreadsheets or datasets to render mock graphical structures.',
    inputFileType: 'any',
    steps: [
      'Analyzing dataset keys...',
      'Compiling metrics values...',
      'Mapping canvas coordinates scales...'
    ],
    successMessage: 'Metrics rendering finished. Chart drawn on canvas.',
    mockResultType: 'document_qa'
  },
  'json-to-xml': {
    id: 'json-to-xml',
    name: 'JSON ↔ XML Parser',
    description: 'Convert document node tags offline between markup formats.',
    inputFileType: 'text',
    steps: [
      'Loading input text document nodes...',
      'Restructuring bracket values arrays...',
      'Writing markup element nodes tags...'
    ],
    successMessage: 'Conversion succeeded. Nodes structure mapped.',
    mockResultType: 'document_qa'
  },
  'yaml-json': {
    id: 'yaml-json',
    name: 'YAML ↔ JSON Converter',
    description: 'Parse text strings indentation levels to match JSON properties key arrays.',
    inputFileType: 'text',
    steps: [
      'Evaluating document structure spacing...',
      'Indexing configuration keys arrays...',
      'Compiling output values syntax...'
    ],
    successMessage: 'Conversion completed successfully.',
    mockResultType: 'document_qa'
  },
  'doc-scanner': {
    id: 'doc-scanner',
    name: 'AI OCR Doc Scanner',
    description: 'Read texts characters out of pictures and image files offline.',
    inputFileType: 'image',
    steps: [
      'Applying image normalization filters...',
      'Binarizing image color channels...',
      'Extracting character contours boxes...',
      'Matching letters font shapes templates...'
    ],
    successMessage: 'OCR Scanning complete. Extracted 4 lines of string text.',
    mockResultType: 'document_qa'
  },
  'pdf-compress': {
    id: 'pdf-compress',
    name: 'PDF File Compressor',
    description: 'Minimize PDF document binary sizes for faster offline storage.',
    inputFileType: 'pdf',
    sliders: [
      { label: 'Compression Quality', min: 10, max: 90, step: 10, defaultValue: 60, unit: '%' }
    ],
    steps: [
      'Decompressing document streams...',
      'Downscaling internal image resolutions...',
      'Purging metadata parameters indices...',
      'Re-compiling compressed PDF binary...'
    ],
    successMessage: 'PDF compression complete. Footprint reduced by 42%.',
    mockResultType: 'document_qa'
  },
  'pdf-extract': {
    id: 'pdf-extract',
    name: 'PDF Metadata Stripper',
    description: 'Extract raw texts paragraphs and document metadata details.',
    inputFileType: 'pdf',
    steps: [
      'Parsing PDF page tree index...',
      'Decoding stream data segments...',
      'Filtering structural metadata fields...'
    ],
    successMessage: 'Metadata and text content extracted successfully.',
    mockResultType: 'document_qa'
  },
  'markdown-pdf': {
    id: 'markdown-pdf',
    name: 'Markdown to PDF',
    description: 'Convert markdown formatting styles to a printable document format.',
    inputFileType: 'text',
    steps: [
      'Compiling markup structures...',
      'Applying styling templates themes...',
      'Paginating document text bounds...'
    ],
    successMessage: 'Document exported successfully as PDF.',
    mockResultType: 'document_qa'
  },
  'pdf-merge': {
    id: 'pdf-merge',
    name: 'PDF Splitter & Merger',
    description: 'Merge separate files or select distinct pages arrays to output.',
    inputFileType: 'pdf',
    steps: [
      'Opening PDF input documents...',
      'Extracting pages streams lists...',
      'Merging structural document nodes...'
    ],
    successMessage: 'PDF merge operation finalized.',
    mockResultType: 'document_qa'
  },
  'bg-remover': {
    id: 'bg-remover',
    name: 'AI Background Remover',
    description: 'Erase image background layers offline in the browser using WebGPU inference calculations.',
    inputFileType: 'image',
    steps: [
      'Downloading segmentation model layers (12MB)...',
      'Configuring WebGPU canvas texture nodes...',
      'Executing tensor image filters segmentation...',
      'Structuring transparent pixel alpha mask...'
    ],
    successMessage: 'Background extracted. Foreground transparency rendering completed.',
    mockResultType: 'image_bg_remove'
  },
  'img-upscale': {
    id: 'img-upscale',
    name: 'AI Image Upscaler',
    description: 'Increase image texture resolutions offline using super-resolution neural networks.',
    inputFileType: 'image',
    sliders: [
      { label: 'Upscale Multiplier', min: 2, max: 4, step: 2, defaultValue: 4, unit: 'x' }
    ],
    steps: [
      'Initializing ESRGAN weight shaders (24MB)...',
      'Allocating WebGPU execution matrices buffers...',
      'Running pixel patches upscale inferences...',
      'Blending texture edges layers...'
    ],
    successMessage: 'Super-resolution complete. Output image visual updated.',
    mockResultType: 'image_upscale'
  },
  'object-detect': {
    id: 'object-detect',
    name: 'AI Object Classifier',
    description: 'Scan items to identify and label classes within frame bounds.',
    inputFileType: 'image',
    sliders: [
      { label: 'Confidence Threshold', min: 0.1, max: 0.9, step: 0.05, defaultValue: 0.5 }
    ],
    steps: [
      'Downloading YOLO inference model weights...',
      'Running box regression neural layers...',
      'Calculating class confidence averages...'
    ],
    successMessage: 'Image scanning complete. Identified key visual target elements.',
    mockResultType: 'object_detect'
  },
  'svg-optimizer': {
    id: 'svg-optimizer',
    name: 'SVG Path Optimizer',
    description: 'Clean vector drawings lines paths to minimize size footprint.',
    inputFileType: 'image',
    steps: [
      'Parsing XML path values...',
      'Optimizing coordinate decimal values precision...',
      'Purging hidden group structures paths...'
    ],
    successMessage: 'SVG optimized. File weight reduced by 35%.',
    mockResultType: 'document_qa'
  },
  'favicon-gen': {
    id: 'favicon-gen',
    name: 'Favicon Studio Creator',
    description: 'Generate multi-resolution app icon configurations from a logo layout.',
    inputFileType: 'image',
    steps: [
      'Downscaling textures dimensions to standard 16x16, 32x32, 48x48...',
      'Formulating standard .ico packaging formats...'
    ],
    successMessage: 'App icons folder generated.',
    mockResultType: 'document_qa'
  },
  'meeting-assistant': {
    id: 'meeting-assistant',
    name: 'AI Audio Meeting Notes',
    description: 'Transcribe recordings to clean summaries and bullet tasks.',
    inputFileType: 'audio',
    steps: [
      'Initializing Whisper audio compilation layers...',
      'Segmenting voice frequencies waves...',
      'Executing token transcribing loops...'
    ],
    successMessage: 'Transcription finished. Notes compiled.',
    mockResultType: 'audio_transcript'
  },
  'voice-recorder': {
    id: 'voice-recorder',
    name: 'Voice Recorder Studio',
    description: 'Record waveforms offline in raw web audio buffers.',
    inputFileType: 'audio',
    steps: [
      'Requesting client audio mic permissions...',
      'Mapping microphone data channels stream...',
      'Compiling wav binary data buffer...'
    ],
    successMessage: 'Audio recording captured offline.',
    mockResultType: 'audio_transcript'
  },
  'text-to-speech': {
    id: 'text-to-speech',
    name: 'Offline Audio Synth',
    description: 'Synthesize custom text paragraphs to readable speech waves.',
    inputFileType: 'text',
    steps: [
      'Analyzing text syllables layouts...',
      'Generating sound waves frequency spectrum...',
      'Synthesizing speech waves audio buffer...'
    ],
    successMessage: 'Speech audio synthesis completed.',
    mockResultType: 'audio_transcript'
  },
  'audio-converter': {
    id: 'audio-converter',
    name: 'WAV ↔ MP3 Transcoder',
    description: 'Adjust sample rate quality layers and compile codec changes.',
    inputFileType: 'audio',
    steps: [
      'Decoding audio stream binary data...',
      'Applying downsampling parameters...',
      'Encoding output binary with target codec...'
    ],
    successMessage: 'Transcoding complete.',
    mockResultType: 'audio_transcript'
  },
  'pixel-art': {
    id: 'pixel-art',
    name: 'AI Pixel Art Maker',
    description: 'Render custom prompt ideas to 8-bit grids pixel files.',
    inputFileType: 'text',
    steps: [
      'Loading pixel design templates...',
      'Calculating grid color matrix elements...',
      'Rendering pixelated graphical layers...'
    ],
    successMessage: 'Pixel art created successfully.',
    mockResultType: 'deck_presentation'
  },
  'avatar-studio': {
    id: 'avatar-studio',
    name: 'Avatar Vector Studio',
    description: 'Build unique illustrated identity faces using base vectors.',
    inputFileType: 'text',
    steps: [
      'Configuring character styles selections...',
      'Rendering SVG paths for visual segments...',
      'Packaging vector group nodes...'
    ],
    successMessage: 'Avatar illustration compiled.',
    mockResultType: 'deck_presentation'
  },
  'logo-creator': {
    id: 'logo-creator',
    name: 'AI Logo Draftsman',
    description: 'Generate initial brand logo concepts based on prompt details.',
    inputFileType: 'text',
    steps: [
      'Analyzing keywords properties...',
      'Drafting geometric layouts...',
      'Compiling typography vector paths...'
    ],
    successMessage: 'Logo drafts compiled.',
    mockResultType: 'deck_presentation'
  },
  'banner-designer': {
    id: 'banner-designer',
    name: 'Promotions Banner Composer',
    description: 'Build grid layouts for advertisement content drafts.',
    inputFileType: 'text',
    steps: [
      'Setting banner grid size properties...',
      'Mapping visual layouts slots...',
      'Rendering target output layout...'
    ],
    successMessage: 'Marketing banner constructed.',
    mockResultType: 'deck_presentation'
  },
  'semantic-search': {
    id: 'semantic-search',
    name: 'Semantic File Indexer',
    description: 'Search directory documents conceptually without literal matches.',
    inputFileType: 'text',
    steps: [
      'Compiling files lists index...',
      'Generating sentence embedding vector sets...',
      'Calculating cosine similarity matching metrics...'
    ],
    successMessage: 'Semantic search results mapped.',
    mockResultType: 'document_qa'
  },
  'wikipedia-offline': {
    id: 'wikipedia-offline',
    name: 'Offline Wiki Reader',
    description: 'Query compiled local index summaries for generic entities.',
    inputFileType: 'text',
    steps: [
      'Searching local wiki database summaries...',
      'Structuring paragraphs content summary...'
    ],
    successMessage: 'Information retrieved.',
    mockResultType: 'document_qa'
  },
  'book-summarizer': {
    id: 'book-summarizer',
    name: 'AI Book Reviewer',
    description: 'Analyze literature works structures to compile chapter reviews.',
    inputFileType: 'text',
    steps: [
      'Indexing chapters layouts...',
      'Extracting main theme components...',
      'Compiling reviews texts...'
    ],
    successMessage: 'Book analysis completed.',
    mockResultType: 'document_qa'
  },
  'research-assistant': {
    id: 'research-assistant',
    name: 'AI Citations Generator',
    description: 'Format standard bibliography indexes and notes formats.',
    inputFileType: 'text',
    steps: [
      'Reading citation variables inputs...',
      'Formatting reference templates strings...'
    ],
    successMessage: 'Citation lines formatted.',
    mockResultType: 'document_qa'
  },
  'aes-encrypt': {
    id: 'aes-encrypt',
    name: 'AES-256 Vault Encryption',
    description: 'Password protect local strings using standard block crypts.',
    inputFileType: 'text',
    steps: [
      'Formatting cryptographic keys buffers...',
      'Applying block cypher formulas indices...',
      'Structuring output base64 data string...'
    ],
    successMessage: 'Key cryptography vault locking completed.',
    mockResultType: 'document_qa'
  },
  'meta-stripper': {
    id: 'meta-stripper',
    name: 'EXIF Metadata Cleaner',
    description: 'Scrub geographic metrics and device traces from images.',
    inputFileType: 'image',
    steps: [
      'Decoding files header segments metadata...',
      'Locating EXIF parameters logs...',
      'Rewriting image paths content without tags...'
    ],
    successMessage: 'File scrubbed. 12 EXIF parameters blocks removed.',
    mockResultType: 'image_bg_remove'
  },
  'leak-checker': {
    id: 'leak-checker',
    name: 'Credentials Leak Scanner',
    description: 'Verify password hashes against public vulnerability lists.',
    inputFileType: 'text',
    steps: [
      'Hashing target password with SHA-1...',
      'Querying offline leak database range...',
      'Matching hash prefix keys lists...'
    ],
    successMessage: 'Leak audit completed. Password hash not found in compromised indexes.',
    mockResultType: 'document_qa'
  },
  'key-generator': {
    id: 'key-generator',
    name: 'SSH & GPG Keys Studio',
    description: 'Generate asymmetric key pairs for system authentications.',
    inputFileType: 'text',
    steps: [
      'Initializing RSA/Ed25519 key seeds...',
      'Calculating prime number key components...',
      'Structuring public/private output keys keys blocks...'
    ],
    successMessage: 'Keys pairs generated successfully.',
    mockResultType: 'document_qa'
  },
  'deck-builder': {
    id: 'deck-builder',
    name: 'AI Presentation Slides Outline',
    description: 'Structure logical deck outlines for slide structures.',
    inputFileType: 'text',
    steps: [
      'Analyzing target topic guidelines...',
      'Designing presentation slides index outline...',
      'Refining points transitions flow...'
    ],
    successMessage: 'Presentation outline generated.',
    mockResultType: 'deck_presentation'
  },
  'mindmap-gen': {
    id: 'mindmap-gen',
    name: 'Mindmap Node Tree Builder',
    description: 'Formulate concept bubbles diagrams from topic ideas.',
    inputFileType: 'text',
    steps: [
      'Parsing main topic keys...',
      'Building branching bubble levels nodes...',
      'Mapping svg vector connections routes...'
    ],
    successMessage: 'Concept mindmap created.',
    mockResultType: 'deck_presentation'
  },
  'flowchart-builder': {
    id: 'flowchart-builder',
    name: 'Mermaid Flowchart Generator',
    description: 'Generate formatted diagram scripts for process flows.',
    inputFileType: 'text',
    steps: [
      'Reading sequence process steps descriptions...',
      'Formatting nodes connector syntax paths...'
    ],
    successMessage: 'Flowchart diagram generated.',
    mockResultType: 'deck_presentation'
  }
};

export default function ToolSystem() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolDefinition | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered tools computed property
  const filteredTools = useMemo(() => {
    let list = TOOLS;
    if (activeCategory) {
      list = list.filter(t => t.category === activeCategory);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => 
        t.name.toLowerCase().includes(q) || 
        t.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCategory, searchQuery]);

  const handleSelectCategory = (categoryId: string | null) => {
    setActiveCategory(categoryId);
    setActiveTool(null); // Return to directory grid
  };

  const handleSelectTool = (tool: ToolDefinition) => {
    setActiveTool(tool);
    // Find category to expand
    setActiveCategory(tool.category);
  };

  const handleBackToDirectory = () => {
    setActiveTool(null);
  };

  // Resolve Category Meta
  const currentCategoryMeta = useMemo(() => {
    return CATEGORIES.find(c => c.id === (activeTool?.category || activeCategory));
  }, [activeCategory, activeTool]);

  return (
    <div className="flex flex-row h-full bg-[#0a0f1d] border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl min-h-[580px]">
      {/* Category selector sidebar */}
      <div className="w-[220px] flex flex-col border-r border-slate-800/85 bg-[#080c18] overflow-y-auto select-none py-3 shrink-0 scrollbar-thin">
        <div className="px-4 py-2 flex items-center gap-2 border-b border-slate-800/60 pb-3 mb-2">
          <div className="w-5 h-5 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Cpu size={12} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-350">Suite Categories</span>
        </div>
        
        <button 
          onClick={() => handleSelectCategory(null)}
          className={`flex items-center gap-2.5 px-4 py-2.5 text-xxs uppercase tracking-wider font-extrabold transition-all border-l-2 text-left ${
            activeCategory === null && !activeTool ? 'border-indigo-500 text-indigo-400 bg-slate-900/40' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/15'
          }`}
        >
          All Categories
        </button>

        {CATEGORIES.map(category => (
          <button 
            key={category.id}
            onClick={() => handleSelectCategory(category.id)}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition-all border-l-2 text-left ${
              (activeCategory === category.id && !activeTool) || (activeTool?.category === category.id)
                ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20' 
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/15'
            }`}
          >
            <span className={category.id === (activeCategory || activeTool?.category) ? 'text-indigo-400' : 'text-slate-500'}>
              {category.icon}
            </span>
            <span className="truncate">{category.name}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#060913]">
        {/* Navigation Breadcrumbs & Search bar */}
        <div className="px-5 py-4 border-b border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-[#080d19]/40">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 truncate">
            <span className="cursor-pointer hover:text-slate-250 transition-colors" onClick={() => { setActiveCategory(null); setActiveTool(null); }}>Toolbox</span>
            {currentCategoryMeta && (
              <>
                <ChevronRight size={12} className="text-slate-600" />
                <span className="cursor-pointer hover:text-slate-250 transition-colors" onClick={() => handleSelectCategory(currentCategoryMeta.id)}>{currentCategoryMeta.name}</span>
              </>
            )}
            {activeTool && (
              <>
                <ChevronRight size={12} className="text-slate-600" />
                <span className="text-white font-bold truncate">{activeTool.name}</span>
              </>
            )}
          </div>

          {/* Search Input */}
          {!activeTool && (
            <div className="relative w-full md:w-64">
              <input 
                type="text" 
                placeholder="Search 66 offline utilities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800/80 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500/80 placeholder-slate-600"
              />
              <Search size={13} className="absolute left-2.5 top-2.5 text-slate-600" />
            </div>
          )}
        </div>

        {/* Display Container */}
        <div className="flex-1 p-5 overflow-y-auto min-h-0">
          {activeTool ? (
            /* Render Active Tool */
            <div className="flex flex-col gap-4">
              <button 
                onClick={handleBackToDirectory}
                className="flex items-center gap-1.5 w-fit text-xxs uppercase tracking-wider font-extrabold text-slate-500 hover:text-slate-300 transition-colors border border-slate-800 bg-slate-900/30 px-3 py-1.5 rounded-lg mb-2"
              >
                <ArrowLeft size={12} /> Back to Grid
              </button>

              {/* Render corresponding tool engine */}
              {activeTool.module === 'dev' && <DevUtilities toolId={activeTool.id} />}
              {activeTool.module === 'code' && <CodeIntelligence toolId={activeTool.id} />}
              {activeTool.module === 'write' && <WritingLanguage toolId={activeTool.id} />}
              {activeTool.module === 'sim' && <AiSimulationConsole config={AI_SIM_CONFIGS[activeTool.id]} />}
            </div>
          ) : (
            /* Render Directory Grid */
            <div className="flex flex-col gap-5">
              <div className="flex justify-between items-center">
                <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                  {activeCategory ? currentCategoryMeta?.name : 'Explore Utilities Dashboard'} ({filteredTools.length})
                </h3>
              </div>

              {filteredTools.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredTools.map(tool => {
                    const toolCat = CATEGORIES.find(c => c.id === tool.category);
                    return (
                      <div 
                        key={tool.id}
                        onClick={() => handleSelectTool(tool)}
                        className="group p-4 bg-[#0a0c16] hover:bg-[#0c0f20] border border-slate-900 hover:border-indigo-500/25 rounded-xl cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(99,102,241,0.05)] transition-all flex flex-col gap-3 justify-between"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${toolCat?.color || 'text-slate-400 bg-slate-800/10'}`}>
                            {toolCat?.icon || <Settings size={14} />}
                          </div>
                          {tool.module === 'sim' && (
                            <span className="text-[9px] font-black uppercase text-indigo-400/90 bg-indigo-500/5 px-2 py-0.5 border border-indigo-500/10 rounded">WebGPU AI</span>
                          )}
                          {tool.module === 'code' && (
                            <span className="text-[9px] font-black uppercase text-emerald-450/90 bg-emerald-500/5 px-2 py-0.5 border border-emerald-500/10 rounded">AI Assisted</span>
                          )}
                          {tool.module === 'dev' && (
                            <span className="text-[9px] font-black uppercase text-amber-500/90 bg-amber-500/5 px-2 py-0.5 border border-amber-500/10 rounded">Offline</span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors tracking-wide">{tool.name}</h4>
                          <p className="text-xxs text-slate-400 leading-relaxed line-clamp-2">{tool.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-slate-500 bg-[#080d1a]/20 border border-slate-900 rounded-xl">
                  <Search size={24} className="text-slate-700 mb-2 animate-bounce" />
                  <p className="text-xs">No matching utilities found in active scope.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
