locals {
  common_tags = {
    Project = var.project_tag
    Student = var.student_tag
  }
}

resource "aws_vpc" "a" {
  cidr_block           = "10.10.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, { Name = "ewb-vpc-a" })
}

resource "aws_subnet" "a_public" {
  vpc_id                  = aws_vpc.a.id
  cidr_block              = "10.10.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, { Name = "ewb-a-public" })
}

resource "aws_subnet" "a_private" {
  vpc_id                  = aws_vpc.a.id
  cidr_block              = "10.10.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = false

  tags = merge(local.common_tags, { Name = "ewb-a-private" })
}

resource "aws_vpc" "b" {
  cidr_block           = "10.20.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, { Name = "ewb-vpc-b" })
}

resource "aws_subnet" "b_private" {
  vpc_id                  = aws_vpc.b.id
  cidr_block              = "10.20.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = false

  tags = merge(local.common_tags, { Name = "ewb-b-private" })
}

resource "aws_internet_gateway" "a" {
  vpc_id = aws_vpc.a.id
  tags   = merge(local.common_tags, { Name = "ewb-igw-a" })
}

resource "aws_route_table" "a_public" {
  vpc_id = aws_vpc.a.id
  tags   = merge(local.common_tags, { Name = "ewb-rt-a-public" })
}

resource "aws_route" "a_public_internet" {
  route_table_id         = aws_route_table.a_public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.a.id
}

resource "aws_route_table_association" "a_public" {
  subnet_id      = aws_subnet.a_public.id
  route_table_id = aws_route_table.a_public.id
}

resource "aws_route_table" "a_private" {
  vpc_id = aws_vpc.a.id
  tags   = merge(local.common_tags, { Name = "ewb-rt-a-private" })
}

resource "aws_route_table_association" "a_private" {
  subnet_id      = aws_subnet.a_private.id
  route_table_id = aws_route_table.a_private.id
}

resource "aws_route_table" "b_private" {
  vpc_id = aws_vpc.b.id
  tags   = merge(local.common_tags, { Name = "ewb-rt-b-private" })
}

resource "aws_route_table_association" "b_private" {
  subnet_id      = aws_subnet.b_private.id
  route_table_id = aws_route_table.b_private.id
}

resource "aws_vpc_peering_connection" "a_b" {
  vpc_id      = aws_vpc.a.id
  peer_vpc_id = aws_vpc.b.id
  auto_accept = true

  tags = merge(local.common_tags, { Name = "ewb-a-b-peer" })
}

resource "aws_route" "a_private_to_b" {
  route_table_id            = aws_route_table.a_private.id
  destination_cidr_block    = aws_vpc.b.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.a_b.id
}

resource "aws_route" "b_private_to_a" {
  route_table_id            = aws_route_table.b_private.id
  destination_cidr_block    = aws_vpc.a.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.a_b.id
}

# The public subnet route table also needs the peer route if the future bastion
# will reach private workloads in VPC B through the peering connection.
resource "aws_route" "a_public_to_b" {
  route_table_id            = aws_route_table.a_public.id
  destination_cidr_block    = aws_vpc.b.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.a_b.id
}

data "aws_availability_zones" "available" {
  state = "available"
}
