# ==================================================================================
# Terraform Configuration - HealthPay Ledger V2 Infrastructure (AWS)
# ==================================================================================
#
# This creates:
# - EKS Cluster
# - VPC with public/private subnets
# - RDS PostgreSQL (Multi-AZ)
# - ElastiCache Redis (Cluster mode)
# - Application Load Balancer
# - S3 buckets for backups
# - CloudWatch logging
#
# ==================================================================================

terraform {
  required_version = ">= 1.6.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }

  backend "s3" {
    bucket         = "healthpay-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "me-south-1"  # Middle East (Bahrain)
    encrypt        = true
    dynamodb_table = "terraform-lock"
  }
}

# ==================== Variables ====================

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "me-south-1"  # Middle East (Bahrain) - closest to Egypt
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "healthpay-production"
}

variable "cluster_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r6g.xlarge"  # 4 vCPU, 32 GB RAM
}

variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.r6g.large"  # 2 vCPU, 13.07 GB RAM
}

# ==================== Provider Configuration ====================

provider "aws" {
  region = var.region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = "HealthPay Ledger V2"
      ManagedBy   = "Terraform"
      Owner       = "HealthFlow Group"
    }
  }
}

# ==================== VPC ====================

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.cluster_name}-vpc"
  cidr = var.vpc_cidr

  azs             = ["${var.region}a", "${var.region}b", "${var.region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  database_subnets = ["10.0.201.0/24", "10.0.202.0/24", "10.0.203.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = false  # HA setup
  enable_dns_hostnames = true
  enable_dns_support   = true

  # Kubernetes tags
  public_subnet_tags = {
    "kubernetes.io/role/elb" = 1
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = 1
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
}

# ==================== EKS Cluster ====================

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  # Cluster access
  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true

  # Add-ons
  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    aws-ebs-csi-driver = {
      most_recent = true
    }
  }

  # Node groups
  eks_managed_node_groups = {
    # General purpose nodes
    general = {
      name = "general"
      
      instance_types = ["t3.xlarge"]  # 4 vCPU, 16 GB RAM
      capacity_type  = "ON_DEMAND"
      
      min_size     = 3
      max_size     = 10
      desired_size = 5
      
      disk_size = 100
      
      labels = {
        role = "general"
      }
      
      tags = {
        NodeGroup = "general"
      }
    }
    
    # Compute-intensive nodes (for payment processing)
    compute = {
      name = "compute"
      
      instance_types = ["c6i.2xlarge"]  # 8 vCPU, 16 GB RAM
      capacity_type  = "SPOT"  # Use spot for cost savings
      
      min_size     = 2
      max_size     = 15
      desired_size = 3
      
      disk_size = 100
      
      labels = {
        role = "compute"
        workload = "payment-processing"
      }
      
      taints = [{
        key    = "workload"
        value  = "payment-processing"
        effect = "NoSchedule"
      }]
      
      tags = {
        NodeGroup = "compute"
      }
    }
    
    # Memory-intensive nodes (for databases, caching)
    memory = {
      name = "memory"
      
      instance_types = ["r6i.2xlarge"]  # 8 vCPU, 64 GB RAM
      capacity_type  = "ON_DEMAND"
      
      min_size     = 2
      max_size     = 8
      desired_size = 3
      
      disk_size = 200
      
      labels = {
        role = "memory"
        workload = "database"
      }
      
      taints = [{
        key    = "workload"
        value  = "database"
        effect = "NoSchedule"
      }]
      
      tags = {
        NodeGroup = "memory"
      }
    }
  }

  # Cluster security group
  cluster_security_group_additional_rules = {
    egress_nodes_ephemeral_ports_tcp = {
      description                = "To node 1025-65535"
      protocol                   = "tcp"
      from_port                  = 1025
      to_port                    = 65535
      type                       = "egress"
      source_node_security_group = true
    }
  }

  # Node security group
  node_security_group_additional_rules = {
    ingress_self_all = {
      description = "Node to node all ports/protocols"
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      type        = "ingress"
      self        = true
    }
    egress_all = {
      description      = "Node all egress"
      protocol         = "-1"
      from_port        = 0
      to_port          = 0
      type             = "egress"
      cidr_blocks      = ["0.0.0.0/0"]
      ipv6_cidr_blocks = ["::/0"]
    }
  }
}

# ==================== RDS PostgreSQL ====================

resource "aws_db_subnet_group" "postgres" {
  name       = "${var.cluster_name}-postgres"
  subnet_ids = module.vpc.database_subnets

  tags = {
    Name = "${var.cluster_name}-postgres"
  }
}

resource "aws_security_group" "postgres" {
  name_prefix = "${var.cluster_name}-postgres-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
    description = "PostgreSQL access from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.cluster_name}-postgres"
  }
}

resource "aws_db_instance" "postgres" {
  identifier = "${var.cluster_name}-postgres"

  # Engine
  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = var.db_instance_class
  allocated_storage    = 500
  max_allocated_storage = 2000
  storage_type         = "gp3"
  storage_encrypted    = true

  # Database
  db_name  = "healthpay_ledger"
  username = "healthpay"
  password = random_password.postgres_password.result

  # Network
  db_subnet_group_name   = aws_db_subnet_group.postgres.name
  vpc_security_group_ids = [aws_security_group.postgres.id]
  publicly_accessible    = false

  # High Availability
  multi_az               = true
  availability_zone      = null  # Let AWS choose

  # Backup
  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"
  copy_tags_to_snapshot  = true
  skip_final_snapshot    = false
  final_snapshot_identifier = "${var.cluster_name}-postgres-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  # Performance
  performance_insights_enabled    = true
  performance_insights_retention_period = 7
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  tags = {
    Name = "${var.cluster_name}-postgres"
  }
}

# ==================== ElastiCache Redis ====================

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.cluster_name}-redis"
  subnet_ids = module.vpc.private_subnets

  tags = {
    Name = "${var.cluster_name}-redis"
  }
}

resource "aws_security_group" "redis" {
  name_prefix = "${var.cluster_name}-redis-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
    description = "Redis access from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.cluster_name}-redis"
  }
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${var.cluster_name}-redis"
  replication_group_description = "HealthPay Redis Cluster"

  # Engine
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = var.redis_node_type
  port                 = 6379

  # Cluster configuration
  num_cache_clusters         = 3
  automatic_failover_enabled = true
  multi_az_enabled          = true

  # Network
  subnet_group_name  = aws_elasticache_subnet_group.redis.name
  security_group_ids = [aws_security_group.redis.id]

  # Encryption
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token_enabled         = true
  auth_token                 = random_password.redis_password.result

  # Maintenance
  maintenance_window       = "mon:03:00-mon:04:00"
  snapshot_window          = "02:00-03:00"
  snapshot_retention_limit = 7

  # Logging
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }

  tags = {
    Name = "${var.cluster_name}-redis"
  }
}

# ==================== S3 Buckets ====================

resource "aws_s3_bucket" "backups" {
  bucket = "${var.cluster_name}-backups"

  tags = {
    Name = "${var.cluster_name}-backups"
  }
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "archive-old-backups"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

# ==================== CloudWatch Logging ====================

resource "aws_cloudwatch_log_group" "eks_cluster" {
  name              = "/aws/eks/${var.cluster_name}/cluster"
  retention_in_days = 30

  tags = {
    Name = "${var.cluster_name}-cluster-logs"
  }
}

resource "aws_cloudwatch_log_group" "redis" {
  name              = "/aws/elasticache/redis/${var.cluster_name}"
  retention_in_days = 30

  tags = {
    Name = "${var.cluster_name}-redis-logs"
  }
}

# ==================== IAM Roles ====================

resource "aws_iam_role" "rds_monitoring" {
  name = "${var.cluster_name}-rds-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "monitoring.rds.amazonaws.com"
      }
    }]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
  ]

  tags = {
    Name = "${var.cluster_name}-rds-monitoring"
  }
}

# ==================== Random Passwords ====================

resource "random_password" "postgres_password" {
  length  = 32
  special = true
}

resource "random_password" "redis_password" {
  length  = 32
  special = true
}

# Store passwords in AWS Secrets Manager
resource "aws_secretsmanager_secret" "postgres_password" {
  name = "${var.cluster_name}/postgres-password"
}

resource "aws_secretsmanager_secret_version" "postgres_password" {
  secret_id     = aws_secretsmanager_secret.postgres_password.id
  secret_string = random_password.postgres_password.result
}

resource "aws_secretsmanager_secret" "redis_password" {
  name = "${var.cluster_name}/redis-password"
}

resource "aws_secretsmanager_secret_version" "redis_password" {
  secret_id     = aws_secretsmanager_secret.redis_password.id
  secret_string = random_password.redis_password.result
}

# ==================== Outputs ====================

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "postgres_endpoint" {
  description = "PostgreSQL endpoint"
  value       = aws_db_instance.postgres.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
  sensitive   = true
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnets" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnets
}

output "backup_bucket" {
  description = "S3 backup bucket"
  value       = aws_s3_bucket.backups.id
}
