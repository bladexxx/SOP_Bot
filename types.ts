export enum Actor {
  USER = 'user',
  BOT = 'bot',
}

export enum CardType {
  WELCOME = 'welcome',
  SOP_CHOOSER = 'sop_chooser',
  CONFIG_SELECTOR = 'config_selector',
  CONFIG_WIZARD = 'config_wizard',
  CONFIG_DETAILS = 'config_details',
  TEST_RESULTS_SUMMARY = 'test_results_summary',
  ANALYSIS_RESULTS = 'analysis_results',
  INTERACTIVE_DIAGNOSTIC = 'interactive_diagnostic',
  CONFIRMATION = 'confirmation',
  ALERT = 'alert',
  FILE_UPLOAD = 'file_upload',
  SOP_GUIDE = 'sop_guide',
  TEST_STARTER = 'test_starter',
  ROOT_CAUSE_ANALYSIS = 'root_cause_analysis',
  BENCHMARK_LIST = 'benchmark_list',
  CONFIG_CREATOR_CHOOSER = 'config_creator_chooser',
  TEMPLATE_SELECTOR = 'template_selector',
  JSON_IMPORTER = 'json_importer',
  TEMPLATE_EDITOR = 'template_editor',
  BENCHMARK_WIZARD = 'benchmark_wizard',
}

export enum ActionType {
    SHOW_SOP_CHOOSER = 'show_sop_chooser',
    START_SOP = 'start_sop',
    SHOW_CONFIG_SELECTOR = 'show_config_selector',
    SELECT_CONFIG = 'select_config',
    START_CONFIG = 'start_config',
    SHOW_CONFIG_CREATOR_CHOOSER = 'show_config_creator_chooser',
    START_FROM_TEMPLATE = 'start_from_template',
    START_CLONE = 'start_clone',
    SELECT_TEMPLATE = 'select_template',
    SUBMIT_CONFIG_STEP = 'submit_config_step',
    UPDATE_CONFIG = 'update_config',
    START_TEST = 'start_test',
    START_BATCH_TEST = 'start_batch_test',
    RUN_TEST_WITH_FILE = 'run_test_with_file',
    DOWNLOAD_REPORT = 'download_report',
    TRIGGER_ANALYSIS = 'trigger_analysis',
    ANALYSIS_FEEDBACK = 'analysis_feedback',
    VIEW_METABASE_REPORT = 'view_metabase_report',
    INVESTIGATE_ROOT_CAUSE = 'investigate_root_cause',
    ROOT_CAUSE_FEEDBACK = 'root_cause_feedback',
    TRIGGER_DIAGNOSTIC = 'trigger_diagnostic',
    RERUN_DIAGNOSTIC = 'rerun_diagnostic',
    REQUEST_PAUSE_PRODUCTION = 'request_pause_production',
    CONFIRM_PAUSE_PRODUCTION = 'confirm_pause_production',
    CANCEL_ACTION = 'cancel_action',
    UPLOAD_FILE = 'upload_file',
    SUGGESTED_ACTION = 'suggested_action',
    VIEW_BENCHMARK_DETAILS = 'view_benchmark_details',
    VIEW_BENCHMARK_ON_METABASE = 'view_benchmark_on_metabase',
    REWIND_SOP_STEP = 'rewind_sop_step',
    SHOW_FLASHCARDS = 'show_flashcards',
    SHOW_JSON_IMPORTER = 'show_json_importer',
    IMPORT_JSON_CONFIG = 'import_json_config',
    SAVE_GENERATED_TEMPLATE = 'save_generated_template',
    SHOW_BENCHMARK_WIZARD = 'show_benchmark_wizard',
    SUBMIT_BENCHMARK_WIZARD = 'submit_benchmark_wizard',
}

export interface Message {
  id: number;
  actor: Actor;
  content?: string;
  card?: Card;
  timestamp: string;
  isGemini?: boolean;
}

export interface Card {
  type: CardType;
  payload?: any;
}

export interface Configuration {
  projectName: string;
  vendorId?: string;
  level: 'Project' | 'Vendor';
  status: 'Active' | 'Paused';
  lastModified: string;
  createdBy: string;
  settings: Record<string, any>;
}

export interface ConfigTemplate {
    templateName: string;
    projectName: string;
    description: string;
    // Defines the fields and their types for the settings
    settingsSchema: Record<string, 'string' | 'number' | 'boolean' | 'json'>;
    defaultValues?: Record<string, any>;
}


export interface BenchmarkDataset {
  id: string;
  projectName: string;
  description: string;
  dataVolume: number;
  vendorCount: number;
  timeliness: 'Last 1 Month' | 'Last 3 Months' | 'Last 6 Months';
  coveredVendors: string[];
}

export interface Flashcard {
    id: number;
    question: string;
    answer: string;
}