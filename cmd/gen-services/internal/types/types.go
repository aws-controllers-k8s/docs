// Copyright Amazon.com Inc. or its affiliates. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License"). You may
// not use this file except in compliance with the License. A copy of the
// License is located at
//
//     http://aws.amazon.com/apache2.0/
//
// or in the "license" file accompanying this file. This file is distributed
// on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
// express or implied. See the License for the specific language governing
// permissions and limitations under the License.

package types

// Controller holds data collected from scanning a single controller repo.
type Controller struct {
	ServiceName    string
	Path           string
	Metadata       *Metadata
	Version        string
	CRDs           []CRDFile
	Examples       []ExampleFile
	Documentation  *DocumentationConfig
}

// DocumentationConfig mirrors the documentation.yaml in controller repos.
type DocumentationConfig struct {
	Resources map[string]*ResourceDocsConfig `yaml:"resources"`
}

// ResourceDocsConfig holds resource-level documentation overrides.
type ResourceDocsConfig struct {
	Note *string `yaml:"note"`
}

// Metadata mirrors the metadata.yaml in controller repos.
type Metadata struct {
	Service struct {
		FullName      string `yaml:"full_name"`
		ShortName     string `yaml:"short_name"`
		Link          string `yaml:"link"`
		Documentation string `yaml:"documentation"`
	} `yaml:"service"`
	APIVersions []struct {
		APIVersion string `yaml:"api_version"`
		Status     string `yaml:"status"`
	} `yaml:"api_versions"`
}

// HelmChart mirrors helm/Chart.yaml.
type HelmChart struct {
	Version string `yaml:"version"`
}

// CRDFile holds the raw content of a CRD YAML file.
type CRDFile struct {
	Name    string
	Path    string
	Content string
}

// ExampleFile holds an example resource from e2e tests.
type ExampleFile struct {
	Name    string
	Kind    string
	Content string
}

// Service is the output format for services.json.
type Service struct {
	Name             string   `json:"name"`
	DisplayName      string   `json:"displayName"`
	Description      string   `json:"description"`
	MaintenancePhase string   `json:"maintenancePhase,omitempty"`
	Version          string   `json:"version,omitempty"`
	CRDCount         int      `json:"crdCount,omitempty"`
	CRDNames         []string `json:"crdNames,omitempty"`
	ChartRepo        string   `json:"chartRepo,omitempty"`
	ImageRepo        string   `json:"imageRepo,omitempty"`
	GithubRepo       string   `json:"githubRepo,omitempty"`
}

// ResourceIndex is the top-level structure for api-reference-index.json.
type ResourceIndex struct {
	TotalServices  int          `json:"totalServices"`
	TotalResources int          `json:"totalResources"`
	TotalExamples  int          `json:"totalExamples"`
	Services       []ServiceRef `json:"services"`
}

// ServiceRef represents a service in the API reference.
type ServiceRef struct {
	Name           string     `json:"name"`
	ReleaseVersion string     `json:"releaseVersion,omitempty"`
	Status         string     `json:"status"` // ga, preview, archived
	Resources      []Resource `json:"resources"`
	Examples       []Example  `json:"examples,omitempty"`
}

// Resource represents a CRD in the API reference.
type Resource struct {
	Kind         string  `json:"kind"`
	Plural       string  `json:"plural"`
	Singular     string  `json:"singular"`
	Group        string  `json:"group"`
	Version      string  `json:"version"`
	Scope        string  `json:"scope"`
	Description  string  `json:"description,omitempty"`
	Note         string  `json:"note,omitempty"`
	Path         string  `json:"path"`
	SpecFields   []Field `json:"specFields"`
	StatusFields []Field `json:"statusFields"`
}

// Field represents a CRD field in spec or status.
type Field struct {
	Name        string  `json:"name"`
	Type        string  `json:"type"`
	Description string  `json:"description,omitempty"`
	Required    bool    `json:"required"`
	Properties  []Field `json:"properties,omitempty"`
	ItemType    string  `json:"itemType,omitempty"`
}

// Example represents an example YAML in the output.
type Example struct {
	Name string `json:"name"`
	Kind string `json:"kind"`
	YAML string `json:"yaml"`
}
