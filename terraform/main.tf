#Minimal Setup for R2 Bucket using AWS Provider
#Lets us set CORS
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5"
    }
  }
}

provider "aws" {
  region = "us-east-2"
}

provider "aws" {
  alias  = "r2"
  region = "us-east-1"


  access_key = var.r2_access_key
  secret_key = var.r2_secret_key

  skip_credentials_validation = true
  skip_region_validation      = true
  skip_requesting_account_id  = true

  endpoints {
    s3 = "https://7c1ee695b69a74a2f4c5aa5171839036.r2.cloudflarestorage.com" # CF Account Endpoint
  }
}

# Backend Configuration
terraform {
  backend "s3" {}
}

# Variables

variable "env" {
  type        = string
  description = "Abbreviated Environment"
}

variable "r2_access_key" {
  type        = string
  description = "R2 Access Key"
  sensitive   = true
}

variable "r2_secret_key" {
  type        = string
  description = "R2 Secret Key"
  sensitive   = true
}

# R2 Bucket and CORS

resource "aws_s3_bucket" "bt_3ds_bucket" {
  provider = aws.r2
  bucket   = "${var.env}-3ds"
}

resource "aws_s3_bucket_cors_configuration" "bt_3ds_bucket_cors_conf" {
  bucket   = aws_s3_bucket.bt_3ds_bucket.id
  provider = aws.r2

  cors_rule {
    allowed_methods = ["GET"]
    allowed_origins = ["https://*.basistheory.com", "https://*.flock-dev.com"]
    allowed_headers = ["*"]
    max_age_seconds = 3600
  }
}
