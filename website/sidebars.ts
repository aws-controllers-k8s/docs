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
          className: 'sidebar-item-new',
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
          className: 'sidebar-item-new',
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
          className: 'sidebar-item-new',
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
      label: 'Contributor Docs',
      className: 'sidebar-category-new',
      collapsed: true,
      link: {
        type: 'doc',
        id: 'contributor-docs/overview',
      },
      items: [
        {
          type: 'doc',
          id: 'contributor-docs/overview',
          label: 'Contribution Overview',
        },
        {
          type: 'doc',
          id: 'contributor-docs/tenets',
          label: 'Project Tenets',
        },
        {
          type: 'doc',
          id: 'contributor-docs/code-generation',
          label: 'Code Generation',
        },
        {
          type: 'doc',
          id: 'contributor-docs/code-organization',
          label: 'Code Organization',
        },
        {
          type: 'doc',
          id: 'contributor-docs/operatorhub-onboarding',
          label: 'OperatorHub Onboarding',
        },
        {
          type: 'doc',
          id: 'contributor-docs/api-inference',
          label: 'API Inference',
        },
        {
          type: 'doc',
          id: 'contributor-docs/setup',
          label: 'Setup',
        },
        {
          type: 'doc',
          id: 'contributor-docs/building-controller',
          label: 'Building a Controller',
        },
        {
          type: 'doc',
          id: 'contributor-docs/code-generator-config',
          label: 'Understanding generator.yaml Configuration',
        },
        {
          type: 'doc',
          id: 'contributor-docs/testing',
          label: 'Testing',
        },
        {
          type: 'doc',
          id: 'contributor-docs/release',
          label: 'Release',
        },
      ],
    },
  ],
};

export default sidebars;
