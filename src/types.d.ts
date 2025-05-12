/**
 * Type declarations for missing module definitions
 */

declare module 'rollup-plugin-visualizer' {
  export interface VisualizerOptions {
    /**
     * Whether to open the visualization automatically
     */
    open?: boolean;
    /**
     * Whether to calculate gzip size
     */
    gzipSize?: boolean;
    /**
     * Whether to calculate brotli size
     */
    brotliSize?: boolean;
    /**
     * The file to write the visualization to
     */
    filename?: string;
    /**
     * The visualization format
     */
    template?: 'sunburst' | 'treemap' | 'network' | 'raw-data';
    /**
     * The title of the visualization
     */
    title?: string;
  }

  /**
   * A Rollup plugin to visualize the bundle size
   */
  export function visualizer(options?: VisualizerOptions): any;
} 