output "vpc_a_id" {
  value = aws_vpc.a.id
}

output "vpc_b_id" {
  value = aws_vpc.b.id
}

output "peering_connection_id" {
  value = aws_vpc_peering_connection.a_b.id
}

output "subnet_ids" {
  value = {
    a_public  = aws_subnet.a_public.id
    a_private = aws_subnet.a_private.id
    b_private = aws_subnet.b_private.id
  }
}
