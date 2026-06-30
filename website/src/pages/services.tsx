import { useState, useMemo, type ReactNode } from 'react';
import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './services.module.css';
import servicesData from '../data/services.json';

interface Service {
  name: string;
  displayName: string;
  description: string;
  maintenancePhase?: 'General Availability' | 'Preview' | 'Deprecated';
  version?: string;
  crdCount?: number;
  crdNames?: string[];
  chartRepo?: string;
  imageRepo?: string;
  githubRepo?: string;
}

const services: Service[] = servicesData as Service[];

const maintenancePhases = ['General Availability', 'Preview', 'Deprecated'] as const;

// Get badge class for maintenance phase
function getMaintenanceBadgeClass(phase: string | undefined): string {
  switch (phase) {
    case 'General Availability':
      return styles.badgeGA;
    case 'Preview':
      return styles.badgePreview;
    case 'Deprecated':
      return styles.badgeDeprecated;
    default:
      return styles.badgePreview;
  }
}

// Get label for maintenance phase
function getMaintenanceLabel(phase: string | undefined): string {
  switch (phase) {
    case 'General Availability':
      return 'General Availability';
    case 'Preview':
      return 'Preview';
    case 'Deprecated':
      return 'Deprecated';
    default:
      return 'Preview';
  }
}

function ServiceCard({ service }: { service: Service }) {
  const githubLogo = useBaseUrl('/img/github-logo.svg');
  const helmLogo = useBaseUrl('/img/helm-logo.svg');
  const apiRefBase = useBaseUrl('/api-reference');
  const apiRefUrl = `${apiRefBase}#${service.name}`;

  return (
    <div className={styles.serviceCard}>
      <a href={apiRefUrl} className={styles.cardLink} aria-label={`View ${service.displayName} API reference`} />
      <div className={styles.cardHeader}>
        <h3>{service.displayName}</h3>
        <div className={styles.badges}>
          <span className={`${styles.badge} ${getMaintenanceBadgeClass(service.maintenancePhase)}`}>
            {getMaintenanceLabel(service.maintenancePhase)}
          </span>
        </div>
      </div>
      <p className={styles.description}>{service.description}</p>

      <div className={styles.metadata}>
        {service.version && (
          <div className={styles.version}>
            <strong>Version:</strong> {service.version}
          </div>
        )}
        {service.crdCount && service.crdCount > 0 && (
          <div className={styles.crdCount}>
            <strong>Resources:</strong>{' '}
            <a href={apiRefUrl}>
              {service.crdCount} CRDs
            </a>
          </div>
        )}
      </div>

      {service.githubRepo && (
        <div className={styles.links}>
          <a href={service.githubRepo} target="_blank" rel="noopener noreferrer" title="GitHub Repository">
            <img src={githubLogo} alt="GitHub" width="24" height="24" />
          </a>
          {service.chartRepo && (
            <a href={`https://gallery.ecr.aws/aws-controllers-k8s/${service.name}-chart`} target="_blank" rel="noopener noreferrer" title="Helm Chart">
              <img src={helmLogo} alt="Helm" width="24" height="24" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function Services(): ReactNode {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaintenance, setSelectedMaintenance] = useState<string>('');

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm === '' ||
        service.displayName.toLowerCase().includes(searchLower) ||
        service.description.toLowerCase().includes(searchLower) ||
        service.name.toLowerCase().includes(searchLower) ||
        service.crdNames?.some((crd) => crd.toLowerCase().includes(searchLower));

      const matchesMaintenance =
        selectedMaintenance === '' || service.maintenancePhase === selectedMaintenance;

      return matchesSearch && matchesMaintenance;
    });
  }, [searchTerm, selectedMaintenance]);

  return (
    <Layout title="ACK Controllers" description="List of ACK Controllers for Kubernetes">
      <main className={styles.servicesPage}>
        <div className="container">
          <div className={styles.header}>
            <h1>ACK Controllers</h1>
            <p className={styles.subtitle}>
              Browse {services.length}+ controllers available for ACK. Each controller lets you
              manage a specific AWS service using native Kubernetes manifests.
            </p>
          </div>

          <div className={styles.filters}>
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />

            <div className={styles.filterGroup}>
              <select
                value={selectedMaintenance}
                onChange={(e) => setSelectedMaintenance(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All Maintenance Phases</option>
                {maintenancePhases.map((phase) => (
                  <option key={phase} value={phase}>
                    {phase}
                  </option>
                ))}
              </select>

              {(searchTerm || selectedMaintenance) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedMaintenance('');
                  }}
                  className={styles.clearButton}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          <div className={styles.resultsCount}>
            Showing {filteredServices.length} of {services.length} services
          </div>

          <div className={styles.serviceGrid}>
            {filteredServices.map((service) => (
              <ServiceCard key={service.name} service={service} />
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className={styles.noResults}>
              <p>No services found matching your filters.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedMaintenance('');
                }}
                className={styles.clearButton}
              >
                Clear All Filters
              </button>
            </div>
          )}

          <div className={styles.proposalSection}>
            <h2>Don't see a service?</h2>
            <p>
              If you don't see a particular AWS service listed, feel free to propose it!
            </p>
            <a
              href="https://github.com/aws-controllers-k8s/community/issues/new?labels=Service+Controller&template=propose_new_controller.md&title=%5Bname%5D+service+controller"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.proposeButton}
            >
              Propose a New Service Controller
            </a>
          </div>
        </div>
      </main>
    </Layout>
  );
}
