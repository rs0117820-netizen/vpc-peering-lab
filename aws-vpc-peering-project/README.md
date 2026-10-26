# AWS VPC Peering Lab

A Terraform project that builds two VPCs and connects their private subnets with VPC Peering in AWS Mumbai (`ap-south-1`).

## What it creates
- VPC A: `10.10.0.0/16`
  - Public subnet: `10.10.1.0/24` (for an optional bastion)
  - Private subnet: `10.10.2.0/24`
  - Internet Gateway and public route table
- VPC B: `10.20.0.0/16`
  - Private subnet: `10.20.1.0/24`
- VPC peering connection and routes in both directions
- Security groups with no world-open SSH rule

## Cost and safety
This starter version creates **network resources only**. It does not launch EC2 instances, NAT Gateways, Elastic IPs, or paid compute resources. VPCs, subnets, route tables, an Internet Gateway, security groups, and peering are generally not billed directly, but always verify current AWS pricing and your account's terms.

No SSH ingress is opened by default. Add only a trusted `/32` source if you later deploy a bastion. Do not use `0.0.0.0/0` for SSH.

## Prerequisites
- A full AWS account with permission to create VPC resources
- AWS CLI configured with an appropriate profile, or another supported AWS credential method
- Terraform installed

Never put AWS access keys or passwords in this project or share them in chat.

## Deploy
From this folder:

```bash
terraform init
terraform fmt
terraform validate
terraform plan
```

Review the plan carefully. To create the network resources:

```bash
terraform apply
```

Type `yes` only after reviewing the plan and confirming the AWS account and region are correct.

## Verify
After apply, inspect the VPCs, route tables, and peering connection in the AWS Console. The peering status should be `active`, and each private route table should contain a route to the other VPC CIDR via the peering connection.

## Cleanup
To delete resources created by this Terraform configuration:

```bash
terraform destroy
```

Review the destroy plan and confirm before proceeding. This only manages resources tracked by this Terraform state.

## Next phase
After the network is verified, EC2 instances and bastion access can be added as a separate, explicitly reviewed step.
