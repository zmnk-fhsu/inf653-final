{
  description = "inf653 final project";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs = {
    self,
    nixpkgs,
  }: let
    system = "x86_64-linux";
    pkgs = import nixpkgs {
      inherit system;
      config.allowUnfree = true;
    };
  in {
    devShells."${system}".default = pkgs.mkShellNoCC {
      buildInputs = with pkgs; [
        nodejs_24
        pnpm
        mongodb-ce
        mongosh
      ];
    };
  };
}
