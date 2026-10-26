variable "aws_region" {
  description = "AWS region for the lab."
  type        = string
  default     = "ap-south-1"
}

variable "project_tag" {
  description = "Project tag applied to created resources."
  type        = string
  default     = "EWB-VPC-Peering"
}

variable "student_tag" {
  description = "Optional student/owner tag."
  type        = string
  default     = "Student"
}
