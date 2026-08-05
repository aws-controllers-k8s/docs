import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Creating a sidebar enables you to:
 * - create an ordered group of docs
 * - render a sidebar for each doc of that group
 * - provide next/previous navigation
 *
 * The sidebars can be generated from the filesystem, or explicitly defined here.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Overview',
    },
    {
      type: 'doc',
      id: 'getting-started',
      label: 'Getting Started',
    },
    {
      type: 'category',
      label: 'Installation',
      collapsed: false,
      items: [
        {
          type: 'doc',
          id: 'getting-started-eks',
          label: 'Using EKS Capabilities',
        },
        {
          type: 'doc',
          id: 'getting-started-helm',
          label: 'Using Helm',
        },
      ],
    },
    {
      type: 'doc',
      id: 'concepts',
      label: 'Core Concepts',
    },
    {
      type: 'category',
      label: 'Authentication & Permissions',
      collapsed: true,
      items: [
        'guides/permissions',
        'guides/configure-iam',
      ],
    },
    {
      type: 'category',
      label: 'Managing Resources',
      collapsed: false,
      items: [
        {
          type: 'doc',
          id: 'guides/create-resource',
          label: 'Create an ACK Resource',
        },
        {
          type: 'doc',
          id: 'guides/readonly',
          label: 'ReadOnly Resources',
        },
        {
          type: 'doc',
          id: 'guides/ignore-field-drift',
          label: 'Ignore Field Drift',
          className: 'sidebar-item-new',
        },
        {
          type: 'doc',
          id: 'guides/deletion-policy',
          label: 'Deletion Policy',
        },
        {
          type: 'doc',
          id: 'guides/multi-region',
          label: 'Resource Region',
        },
        {
          type: 'doc',
          id: 'guides/cross-account',
          label: 'Granular IAM Roles',
        },
        {
          type: 'doc',
          id: 'guides/adoption',
          label: 'Resource Adoption',
        },
        {
          type: 'doc',
          id: 'guides/field-export',
          label: 'Field Export',
        },
        {
          type: 'doc',
          id: 'guides/kro',
          label: 'Using ACK with kro',
        },
      ],
    },
    {
      type: 'category',
      label: 'Controller Configuration',
      collapsed: true,
      items: [
        'guides/helm-values',
        'guides/feature-gates',
        'guides/performance',
      ],
    },
    {
      type: 'category',
      label: 'Contributing',
      className: 'sidebar-category-new',
      collapsed: true,
      items: [
        'contributing/index',
        'contributing/setup',
        'contributing/code-organization',
        'contributing/building-controller',
        {
          type: 'category',
          label: 'Code Generation',
          collapsed: true,
          items: [
            'contributing/code-generation/overview',
            'contributing/code-generation/configuration',
            'contributing/code-generation/hooks',
            'contributing/code-generation/field-config',
          ],
        },
        'contributing/testing',
        'contributing/releasing',
      ],
    },
    {
      type: 'doc',
      id: 'breaking-changes',
      label: 'Breaking Changes',
      className: 'sidebar-item-new',
    },
  ],
};

export default sidebars;
